import { getCollections } from "../config/db.js";
import { subDays, startOfDay } from "date-fns";


export const addProfileView = async (req, res) => {
  try {
    const { profileViewCollection } = getCollections();
    const { profileOwnerEmail, visitorEmail, visitorName } = req.body;
    
    if (profileOwnerEmail === visitorEmail) {
      return res.status(400).json({ message: "Visitor and profile owner cannot be the same" });    
    }

    // const today = new Date();
    // today.setHours(0, 0, 0, 0);

    // const tomorrow = new Date(today);
    // tomorrow.setDate(tomorrow.getDate() + 1);

    const existingProfileView = await profileViewCollection.findOne({ profileOwnerEmail, visitorEmail });

    if (existingProfileView) {
      return res.status(200).json({ message: "Profile view already exists" });
    }

    await profileViewCollection.insertOne({
      profileOwnerEmail,
      visitorEmail,
      visitorName,
      visitedAt: new Date(),
      // visitedAt: { $gte: today, $lt: tomorrow },
    });

    res.status(201).json({ message: "Profile view added successfully" });
    
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

export const getLast7DaysProfileViews = async (req, res) => {
  try {
    const { profileViewCollection } = getCollections();
    const myEmail = req.query.email;

    // গত ৭ দিনের তারিখ বের করা
    const sevenDaysAgo = subDays(new Date(), 6); // আজসহ ৭ দিন
    const startDate = startOfDay(sevenDaysAgo);

    const pipeline = [
      { 
        $match: { 
          profileOwnerEmail: myEmail, 
          visitedAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: { $dayOfWeek: "$visitedAt" }, // সপ্তাহের দিন অনুযায়ী group
          count: { $sum: 1 }
        }
      }
    ];

    const results = await profileViewCollection.aggregate(pipeline).toArray();

    // day map
    const dayMap = {
      1: "Sun",
      2: "Mon",
      3: "Tue",
      4: "Wed",
      5: "Thu",
      6: "Fri",
      7: "Sat",
    };

    const formatted = results.map(r => ({
      day: dayMap[r._id],
      views: r.count
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching 7-day views:", err);
    res.status(500).json({ message: "Server error" });
  }
};



