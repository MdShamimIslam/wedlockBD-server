import { getCollections } from "../config/db.js";
import { calculateAge } from "../utils/functions.js";

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
