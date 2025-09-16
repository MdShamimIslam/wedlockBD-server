import { getCollections } from "../config/db.js";

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
