import { getCollections } from "../config/db.js";

export const getAdminStats = async (_req, res) => {
  try {
    const { userCollection, successStoryCollection, bioDataCollection, requestCollection, premiumBiodataCollection, profileViewCollection  } = getCollections();

    const totalUsers = await userCollection.estimatedDocumentCount();
    const totalSuccessStory = await successStoryCollection.estimatedDocumentCount();
    const totalBiodata = await bioDataCollection.estimatedDocumentCount();
    const totalProUsers = await bioDataCollection.countDocuments({ premium_status: true });
    const totalRequest = await requestCollection.estimatedDocumentCount();
    const totalRevenue = (totalProUsers * 10) + (totalRequest * 1);

    const proPending = await premiumBiodataCollection.countDocuments({ payment_status: "pending" });
    const reqPending = await requestCollection.countDocuments({ status: "pending" });
    const totalPending = proPending + reqPending;

    // Age group aggregation
    const now = new Date();
    const ageGroupAggregation = await bioDataCollection.aggregate([
      {
        $addFields: {
          validDob: {
            $cond: [
              { $and: [{ $ne: ["$date_of_birth", null] }, { $ne: ["$date_of_birth", ""] }] },
              { $toDate: "$date_of_birth" },
              null
            ]
          }
        }
      },
      {
        $addFields: {
          age: {
            $cond: [
              { $ifNull: ["$validDob", false] },
              {
                $floor: {
                  $divide: [
                    { $subtract: [now, "$validDob"] },
                    1000 * 60 * 60 * 24 * 365
                  ]
                }
              },
              null
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [18, 26, 31, 36, 41, 150],
          default: "Unknown",
          output: {
            count: { $sum: 1 },
            male: {
              $sum: { $cond: [{ $eq: ["$biodata_type", "Male"] }, 1, 0] }
            },
            female: {
              $sum: { $cond: [{ $eq: ["$biodata_type", "Female"] }, 1, 0] }
            }
          }
        }
      }
    ]).toArray();
    const labels = ["18-25", "26-30", "31-35", "36-40", "40+"];
    const ageGroupData = ageGroupAggregation.map((item, index) => ({
      age: labels[index] || "Unknown",
      count: item.count,
      male: item.male,
      female: item.female
    }));

    // Gender aggregation
    const genderAggregation = await bioDataCollection.aggregate([
      { $match: {} }, 
      { $group: { _id: "$biodata_type", count: { $sum: 1 } } }
    ]).toArray();
    const genderData = genderAggregation.map(item => {
      let color;
      if (item._id === "Male") color = "#3B82F6";
      else if (item._id === "Female") color = "#EC4899";
      else color = "#10B981"; 

      const total = totalUsers || 1; 
      const percentage = ((item.count / total) * 100).toFixed(1);

      return { name: item._id, value: item.count, color, percentage: Number(percentage) };
    });
    // ===== Top Matches (from Success Stories) =====
    const successStories = await successStoryCollection.find().sort({ post_date: -1 }).limit(5).toArray();
    const topMatches = await Promise.all(
      successStories.map(async (story) => {
        const selfBiodata = await bioDataCollection.findOne({ biodata_id: story.selfBiodataId });
        const partnerBiodata = await bioDataCollection.findOne({ biodata_id: story.partnerBiodataId });

        const coupleName = `${selfBiodata?.name || "Unknown"} & ${partnerBiodata?.name || "Unknown"}`;
        const location = selfBiodata?.present_division_name || "Unknown";

        return {
          couple: coupleName,
          date: story.marriage_date || "N/A",
          location,
          status: story.story_type || "N/A",
          img: story.img || null
        };
      })
    );

    // --- Weekly Activity Data ---
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const requestsPerDay = await requestCollection.aggregate([
      { $match: { createdAt: { $gte: startOfWeek, $lte: endOfToday } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const viewsPerDay = await profileViewCollection.aggregate([
      { $match: { visitedAt: { $gte: startOfWeek, $lte: endOfToday } } },
      {
        $group: {
          _id: { $dayOfWeek: "$visitedAt" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const premiumPerDay = await premiumBiodataCollection.aggregate([
      { $match: { payment_date: { $gte: startOfWeek, $lte: endOfToday } } },
      {
        $group: {
          _id: { $dayOfWeek: "$payment_date" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dailyActivityData = dayMap.map((day, idx) => {
      const requests = requestsPerDay.find(i => i._id === idx + 1)?.count || 0;
      const profileViews = viewsPerDay.find(i => i._id === idx + 1)?.count || 0;
      const premiumPurchases = premiumPerDay.find(i => i._id === idx + 1)?.count || 0;

      return {
        day,
        requestsSent: requests,
        profileViews,
        premiumPurchases
      };
    });

    res.send({ totalUsers, totalSuccessStory, totalBiodata, totalProUsers, totalRequest, totalRevenue, totalPending, ageGroupData, genderData, topMatches, dailyActivityData });

  } catch (err) {
    res.status(500).send({ error: "Failed to fetch admin stats" });
  }
};


