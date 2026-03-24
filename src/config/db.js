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
      profileViewCollection: db.collection("profileViews"),
    };

    // Create unique indexes to prevent double insert race conditions from concurrent Stripe webhooks
    try {
      await collections.requestCollection.createIndex({ sessionId: 1 }, { unique: true, sparse: true });
      await collections.premiumBiodataCollection.createIndex({ sessionId: 1 }, { unique: true, sparse: true });
    } catch (indexErr) {
      console.warn("Could not create unique index on sessionId. Existing duplicates might be present.");
    }
  }
  return collections;
}


export const getCollections = () => {
  if (!db) throw new Error("DB not initialized. Call connectDB() first.");
  return collections;
}



