import { getCollections } from "../config/db.js";
import { calculateAge } from "../utils/functions.js";
import { subDays, startOfDay } from "date-fns";

export const getUserStats = async (_req, res) => {
  try {
    const { bioDataCollection, successStoryCollection } = getCollections();

    const totalBiodatas = await bioDataCollection.estimatedDocumentCount();
    const successStories = await successStoryCollection.estimatedDocumentCount();
    const maleBiodatas = await bioDataCollection.countDocuments({ biodata_type: "Male" });
    const femaleBiodatas = await bioDataCollection.countDocuments({ biodata_type: "Female" });

    res.send({ totalBiodatas, successStories, maleBiodatas, femaleBiodatas });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch user stats" });
  }
};

export const getOverviewOfNormalUser = async (req, res) => {
  try {
    const { bioDataCollection, favoriteCollection, requestCollection, profileViewCollection } = getCollections();
    const myEmail = req.query.email;
    const decodedEmail = req.decoded.email;

    if (myEmail !== decodedEmail) {
      return res.status(403).send({ error: "Forbidden access" });
    }

    const myBiodata = await bioDataCollection.findOne({ contact_email: myEmail });
    if (!myBiodata) {
      return res.status(404).json({ message: "Biodata not found for this user" });
    }

    const { biodata_type, expected_partner_height, expected_partner_weight, expected_partner_age } = myBiodata;

    const oppositeBiodatas = await bioDataCollection.find({
      biodata_type: biodata_type === "Male" ? "Female" : "Male",
      height: expected_partner_height,
      weight: expected_partner_weight
    }).toArray();

    const matches = oppositeBiodatas.filter(bio => {
      const age = calculateAge(bio.date_of_birth);
      return age === expected_partner_age;
    });

    const favorite = await favoriteCollection.find({ contact_email: myEmail }).toArray();
    const request = await requestCollection.find({ partnerEmail: myEmail }).toArray();
    const profileView = await profileViewCollection.find({ profileOwnerEmail: myEmail }).toArray();

    const overview = { favorite, request, profileView, matches };
    res.send(overview);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch of overview" });
  }
};

export const getLast7DaysStats = async (req, res) => {
  try {
    const { profileViewCollection, favoriteCollection, requestCollection } = getCollections();
    const myEmail = req.query.email;

    const sevenDaysAgo = subDays(new Date(), 6);
    const startDate = startOfDay(sevenDaysAgo);

    const dayMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };

    // Helper function for aggregation
    const aggregateLast7Days = async (collection, matchField, dateField) => {
      const pipeline = [
        { $match: { [matchField]: myEmail, [dateField]: { $gte: startDate } } },
        { $group: { _id: { $dayOfWeek: `$${dateField}` }, count: { $sum: 1 } } }
      ];
      const results = await collection.aggregate(pipeline).toArray();
      return results.map(r => ({ day: dayMap[r._id], count: r.count }));
    };

    const [views, favorites, requests] = await Promise.all([
      aggregateLast7Days(profileViewCollection, "profileOwnerEmail", "visitedAt"),
      aggregateLast7Days(favoriteCollection, "profileOwnerEmail", "createdAt"),
      aggregateLast7Days(requestCollection, "selfEmail", "createdAt"),
    ]);

    res.json({ views, favorites, requests });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
