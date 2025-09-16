import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

export const getContactRequests = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const userEmail = req.query.email;
    const result = await requestCollection.find({ selfEmail: userEmail }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch contact requests" });
  }
};

export const addContactRequest = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const contactInfo = req.body;
    const result = await requestCollection.insertOne(contactInfo);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to add contact request" });
  }
};

export const deleteContactRequest = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await requestCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to delete contact request" });
  }
};

export const updateContactRequestStatus = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const updatedDoc = { $set: { status: "Approved" } };
    const result = await requestCollection.updateOne({ _id: new ObjectId(id) }, updatedDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to update contact request status" });
  }
};
