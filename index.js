
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());



const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    // collection
    const bioDataCollection = client.db('wedlockBD').collection('biodatas');
    const successStoryCollection = client.db('wedlockBD').collection('successStories');
    const requestCollection = client.db('wedlockBD').collection('requests');
    const favoriteCollection = client.db('wedlockBD').collection('favorites');


    // biodata related api
    // get bio by sort
    app.get('/limit-biodatas',async(req,res)=>{
      const result = await bioDataCollection.find().sort({age:1}).toArray();
      res.send(result);
    })
    // get all bio
    app.get('/biodatas',async(req,res)=>{
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    })
    // get gender based bio 
    app.get('/gender-biodatas',async(req,res)=>{
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    })
    // get bio for specific details bio
    app.get('/biodatas/:id',async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)}
      const result = await bioDataCollection.findOne(query)
      res.send(result);
    })
    // insert bio from client
    app.post('/biodatas',async(req,res)=>{
      const biodata = req.body;
      const result = await bioDataCollection.insertOne(biodata);
      res.send(result);
    })

    // successStory related api
    app.get('/successStories',async(req,res)=>{
      const result = await successStoryCollection.find().toArray();
      res.send(result);
    })

    // contact request related api
    app.get('/contact-request',async(req,res)=>{
      const result = await requestCollection.find().toArray();
      res.send(result);
    })

    // favorite related api
    // get all favorite data
    app.get('/favorite',async(req,res)=>{
      const result = await favoriteCollection.find().toArray();
      res.send(result);
    })

    // post by client side bioInfo
    app.post('/favorites',async(req,res)=>{
      const bioInfo = req.body;
      const result = await favoriteCollection.insertOne(bioInfo);
      res.send(result);
    })











    

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("WedlockBD server is running...");
  });
  
  app.listen(port, (req, res) => {
    console.log(`WedlockBD server is running on port : ${port}`);
  });