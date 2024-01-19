const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // collection
    const bioDataCollection = client.db("wedlockBD").collection("biodatas");
    const successStoryCollection = client.db("wedlockBD").collection("successStories");
    const requestCollection = client.db("wedlockBD").collection("requests");
    const favoriteCollection = client.db("wedlockBD").collection("favorites");
    const userCollection = client.db("wedlockBD").collection("users");
    const premiumBiodataCollection = client.db("wedlockBD").collection("premiumBiodatas");


    // START------biodata related api-------
    // get bio by sort
    app.get("/limit-biodatas", async (req, res) => {
      const result = await bioDataCollection.find().limit(6).sort({ age: 1 }).toArray();
      res.send(result);
    });
    // get all bio
    app.get("/biodatas", async (req, res) => {
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    });
    // get gender based bio
    app.get("/gender-biodatas", async (req, res) => {
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    });
    // get bio for specific details bio
    app.get("/biodatas/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bioDataCollection.findOne(query);
      res.send(result);
    });
    // get bio by user email 
    app.get('/v1/biodatas',async(req,res)=>{
      const userEmail = req.query.email;
      const query = {contact_email:userEmail};
      const result = await bioDataCollection.findOne(query);
      res.send(result);
    })
    // insert bio from client
    app.post("/biodatas", async (req, res) => {
      const biodata = req.body;
      const latestBiodata = await bioDataCollection.findOne(
        {},
        { sort: { biodata_id: -1 } }
      );
      const newBiodataId = latestBiodata ? latestBiodata.biodata_id + 1 : 1;
      const newBiodata = {
        ...biodata,
        biodata_id: newBiodataId,
      };
      const result = await bioDataCollection.insertOne(newBiodata);
      res.send(result);
    });
    // update bio
    app.put('/biodatas',async(req,res)=>{
      const updateBio = req.body;
      const userEmail = req.query.email;
      const filter = {contact_email : userEmail};
      const options = {upsert:true};
      const updatedDoc = {
        $set : {
          age:updateBio.age,
          biodata_type:updateBio.biodata_type,
          contact_number:updateBio.contact_number,
          date_of_birth:updateBio.date_of_birth,
          expected_partner_age:updateBio.expected_partner_age,
          expected_partner_height:updateBio.expected_partner_height,
          expected_partner_weight:updateBio.expected_partner_weight,
          fathers_name:updateBio.fathers_name,
          height:updateBio.height,
          mothers_name:updateBio.mothers_name,
          name:updateBio.name,
          occupation:updateBio.occupation,
          permanent_division_name:updateBio.permanent_division_name,
          present_division_name:updateBio.present_division_name,
          profile_image:updateBio.profile_image,
          race:updateBio.race,
          weight:updateBio.weight,
        }
      }
      const result = await bioDataCollection.updateOne(filter,updatedDoc,options);
      res.send(result);
    })
    // END------biodata related api-------




    // START------successStory related api-------
    
    app.get("/successStories", async (req, res) => {
      const result = await successStoryCollection.find().toArray();
      res.send(result);
    });
    // END------successStory related api-------



    // START------contact request related api-------

    // get request contact info (user email get and only get)
    app.get("/contact-request", async (req, res) => {
      const userEmail = req.query.email;
      const  query = {selfEmail : userEmail}
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });
    // save some bio when payment confirm
    app.post("/contact-request", async (req, res) => {
      const contactInfo = req.body;
      const result = await requestCollection.insertOne(contactInfo);
      res.send(result)
    });
    // delete contact request
    app.delete('/contact-request/:id',async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })

    // END------contact request related api-------



    // START------favorite related api-------
    // get all favorite data
    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      const query = {email : email};
      const result = await favoriteCollection.find(query).toArray();
      res.send(result);
    });
    // post by client side bioInfo
    app.post("/favorites", async (req, res) => {
      const bioInfo = req.body;
      const result = await favoriteCollection.insertOne(bioInfo);
      res.send(result);
    });
    // delete favorites bio
    app.delete('/favorites/:id',async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    })
    // END------favorite related api-------




    // START------users related api-------
    // insert user from client side
    app.post('/users',async(req,res)=>{
    const user = req.body;
    const query = {email:user?.email};
    const existingUser = await userCollection.findOne(query);
    if(existingUser){
      return res.send({ message: "Already exist the email",insertedId: null,})
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
    })

    // get all users from db
    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    // END------users related api-------




    // START------premium bio related api-------
    app.post('/premium-bio',async(req,res)=>{
      const premiumBio = req.body;
      const result = await premiumBiodataCollection.insertOne(premiumBio);
      res.send(result)
    })

    // END------premium bio related api-------



    // START------Payment related api--------
    // create payment intent
     app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // END------Payment related api--------






    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
