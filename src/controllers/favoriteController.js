import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";


export const getFavorites = async (req, res) => {
  try {
    const { favoriteCollection } = getCollections();
    const email = req.query.email;
    const result = await favoriteCollection.find({ email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch favorites" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { favoriteCollection } = getCollections();
    const bioInfo = req.body;

    const exists = await favoriteCollection.findOne({
      email: bioInfo.email,
      biodata_id: bioInfo.biodata_id,
    });

    if (exists) {
      return res.send({ insertedId: null });
    }

    const result = await favoriteCollection.insertOne(bioInfo);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to add favorite" });
  }
};

export const deleteFavorite = async (req, res) => {
  try {
    const { favoriteCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await favoriteCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to delete favorite" });
  }
};
