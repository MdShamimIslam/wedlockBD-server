import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

// get limited premium biodatas
export const getLimitedBiodatas = async (_req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const result = await bioDataCollection
      .find({ premium_status: true })
      .limit(6)
      .sort({ date_of_birth: 1 })
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch limited biodatas" });
  }
};

// get all biodatas with filter, search, sort, pagination
export const getBiodatas = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const { search, division, occupation, biodataType, minAge, maxAge, sortBy, page = 1, limit } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { occupation: { $regex: search, $options: "i" } },
        { present_division_name: { $regex: search, $options: "i" } }
      ];
    }

    if (division) query.present_division_name = division;
    if (occupation) query.occupation = occupation;
    if (biodataType) query.biodata_type = biodataType;

    if (minAge && maxAge) {
      const today = new Date();
      const minBirthDate = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate()).toISOString().split("T")[0];
      const maxBirthDate = new Date(today.getFullYear() - parseInt(maxAge) - 1, today.getMonth(), today.getDate()).toISOString().split("T")[0];
      query.date_of_birth = { $gte: maxBirthDate, $lte: minBirthDate };
    }

    let cursor = bioDataCollection.find(query);

    if (sortBy === "ageAsc") cursor = cursor.sort({ date_of_birth: -1 });
    if (sortBy === "ageDesc") cursor = cursor.sort({ date_of_birth: 1 });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const result = await cursor.skip(skip).limit(parseInt(limit)).toArray();

    // calculate age
    const today = new Date();
    result.forEach(doc => {
      const birthDate = new Date(doc.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      doc.age = age;
    });

    const total = await bioDataCollection.countDocuments(query);

    res.send({
      biodatas: result,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch biodatas" });
  }
};

// get biodata by email
export const getBiodataByEmail = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const userEmail = req.query.email;
    if (!userEmail) return res.status(400).send({ error: "Email is required" });

    const result = await bioDataCollection.findOne({ contact_email: userEmail });
    res.send(result || {});
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch biodata" });
  }
};

// get single biodata by id
export const getBiodataById = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });

    const result = await bioDataCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch biodata" });
  }
};

// insert biodata
export const insertBiodata = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const biodata = req.body;

    const existing = await bioDataCollection.findOne({ contact_email: biodata.contact_email });
    if (existing) return res.status(400).send({ message: "Biodata already exists!" });

    const latestBiodata = await bioDataCollection.findOne({}, { sort: { biodata_id: -1 } });
    const newBiodataId = latestBiodata ? latestBiodata.biodata_id + 1 : 1;

    const newBiodata = { ...biodata, biodata_id: newBiodataId };
    const result = await bioDataCollection.insertOne(newBiodata);

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to insert biodata" });
  }
};

// update biodata
export const updateBiodata = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const updateBio = req.body;
    const userEmail = req.query.email;

    const filter = { contact_email: userEmail };
    const options = { upsert: true };
    const updatedDoc = { $set: { ...updateBio } };

    const result = await bioDataCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to update biodata" });
  }
};

// make biodata premium
export const makePremium = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const email = req.params.email;

    const filter = { contact_email: email };
    const updatedDoc = { $set: { premium_status: true } };

    const result = await bioDataCollection.updateOne(filter, updatedDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to make premium" });
  }
};
