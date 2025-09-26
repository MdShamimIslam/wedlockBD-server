import jwt from "jsonwebtoken";
import { getCollections } from "../config/db.js";


export const verifyToken = (req, res, next) => {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const { userCollection } = getCollections();
    const decodedEmail = req.decoded.email;
    const user = await userCollection.findOne({ email: decodedEmail });

    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "Forbidden access" });
    }

    next();
  } catch (err) {
    res.status(500).send({ error: "Admin verification failed" });
  }
};
