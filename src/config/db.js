import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

let collections = {};

export const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db("wedlockBD");
    console.log("MongoDB Connected");

    collections = {
      bioDataCollection: db.collection("biodatas"),
      successStoryCollection: db.collection("successStories"),
      requestCollection: db.collection("requests"),
      favoriteCollection: db.collection("favorites"),
      userCollection: db.collection("users"),
      premiumBiodataCollection: db.collection("premiumBiodatas"),
    };
  }
  return collections;
}


export const getCollections = () => {
  if (!db) throw new Error("DB not initialized. Call connectDB() first.");
  return collections;
}
