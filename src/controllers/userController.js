import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// check if user is admin
export const checkAdmin = async (req, res) => {
  try {
    const { userCollection } = getCollections();
    const email = req.params.email;

    const user = await userCollection.findOne({ email });
    if (user?.role === "admin") {
      return res.send({ admin: true });
    }
    res.send({ admin: false });
  } catch (err) {
    res.status(500).send({ error: "Failed to check admin" });
  }
};

// insert user
export const insertUser = async (req, res) => {
  try {
    const { userCollection } = getCollections();
    const user = req.body;
    const existingUser = await userCollection.findOne({ email: user?.email });

    if (existingUser) {
      return res.send({ message: "Already exist the email", insertedId: null });
    }

    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to insert user" });
  }
};

// get all users
export const getAllUsers = async (_req, res) => {
  try {
    const { userCollection } = getCollections();
    const result = await userCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch users" });
  }
};

// delete user (admin-only)
export const deleteUser = async (req, res) => {
  try {
    const { userCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to delete user" });
  }
};

// update user (admin-only)
export const updateUser = async (req, res) => {
  try {
    const { userCollection } = getCollections();
    const id = req.params.id;
    const userInfo = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }

    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = { $set: { role: userInfo.role } };

    const result = await userCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to update user" });
  }
};
