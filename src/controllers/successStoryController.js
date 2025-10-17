import { ObjectId } from "mongodb";
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
    const { bioDataCollection, successStoryCollection } = getCollections();
    const successStory = req.body;
    const decodedEmail = req.decoded.email;

    const biodataViaEmail = await bioDataCollection.findOne({ contact_email: decodedEmail });

    const existingSuccessStory = await successStoryCollection.findOne({ selfBiodataId: biodataViaEmail.biodata_id});
    if (existingSuccessStory) {
      return res.status(400).send({ message: "You have already added a success story" });
    }

    const result = await successStoryCollection.insertOne(successStory);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to add success story" });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { successStoryCollection } = getCollections();
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await successStoryCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  }
  catch (err) {
    res.status(500).send({ error: "Failed to delete success story" });
  }
}
