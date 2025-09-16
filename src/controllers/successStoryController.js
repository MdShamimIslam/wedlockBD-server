import { getCollections } from "../config/db.js";

export const getSuccessStories = async (_req, res) => {
  try {
    const { successStoryCollection } = getCollections();
    const result = await successStoryCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch success stories" });
  }
};

export const addSuccessStory = async (req, res) => {
  try {
    const { successStoryCollection } = getCollections();
    const successStory = req.body;
    const result = await successStoryCollection.insertOne(successStory);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to add success story" });
  }
};
