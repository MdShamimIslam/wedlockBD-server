import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

export const addPremiumBio = async (req, res) => {
  try {
    const { premiumBiodataCollection } = getCollections();
    const premiumBio = req.body;
    const result = await premiumBiodataCollection.insertOne(premiumBio);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to add premium bio" });
  }
};

export const getPremiumBioByEmail = async (req, res) => {
  try {
    const { premiumBiodataCollection } = getCollections();
    const email = req.query.email;
    const result = await premiumBiodataCollection.find({ contact_email: email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch premium bio" });
  }
};

export const deletePremiumBio = async (req, res) => {
  try {
    const { premiumBiodataCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await premiumBiodataCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to delete premium bio" });
  }
};
