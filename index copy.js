const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  },
});

async function run() {
  try {
    // collection
    const db = client.db("wedlockBD");
    const bioDataCollection = db.collection("biodatas");
    const successStoryCollection = db.collection("successStories");
    const requestCollection = db.collection("requests");
    const favoriteCollection = db.collection("favorites");
    const userCollection = db.collection("users");
    const premiumBiodataCollection = db.collection("premiumBiodatas");



    // START------jwt related api-------
    // verify token
    const verifyToken = (req, res, next) => {
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
    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "Admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };
    // create token
    app.post("/jwt", (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    });
   // END------jwt related api-------

    // payment intent
    app.post("/checkout-session/:biodataId", verifyToken, async (req, res) => {
      try {
        const biodataId = req.params.biodataId;
        const userEmail = req.decoded.email;
    
        const biodata = await bioDataCollection.findOne({ biodata_id: parseInt(biodataId) });
        
        const user = await userCollection.findOne({ email: userEmail });
    
        if (!biodata) return res.status(404).json({ success: false, message: "Profile not found" });
    
        const price = 5;
    
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
          cancel_url: `${req.protocol}://${req.get("host")}/biodatas/${biodataId}`,
          customer_email: user.email,
          client_reference_id: biodataId,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: price * 100,
                product_data: {
                  name: biodata.name,
                  description: biodata.occupation,
                  images: [biodata.profile_image],
                },
              },
              quantity: 1,
            },
          ],
        });
    
        // Save payment attempt
        await premiumBiodataCollection.insertOne({
          biodataId: biodata._id,
          userEmail: user.email,
          price,
          sessionId: session.id,
          status: "pending",
          createdAt: new Date(),
        });
    
        res.status(200).json({ success: true, session });
    
      } catch (err) {
        console.error("Stripe checkout-session error:", err);
        res.status(500).json({ success: false, message: "Failed to create checkout session" });
      }
    });

    // START------biodata related api-------
    // get limit bio
    app.get("/limit-biodatas", async (_req, res) => {
      const result = await bioDataCollection.find({ premium_status: true }).limit(6).sort({ date_of_birth: 1 }).toArray();
        res.send(result);
    });
    // get all biodatas with filter, search, sort, pagination
    app.get("/biodatas", async (req, res) => {
      const { search, division, occupation, biodataType, minAge, maxAge, sortBy, page = 1, limit } = req.query;
    
      let query = {};
    
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { occupation: { $regex: search, $options: "i" } },
          { present_division_name: { $regex: search, $options: "i" } }
        ];
      }
    
      if (division) {
        query.present_division_name = division;
      }
    
      if (occupation) {
        query.occupation = occupation;
      }
    
      if (biodataType) {
        query.biodata_type = biodataType;
      }
    
      if (minAge && maxAge) {
        const today = new Date();

        const minBirthDate = new Date(
          today.getFullYear() - parseInt(minAge),
          today.getMonth(),
          today.getDate()
        ).toISOString().split("T")[0];
    
        const maxBirthDate = new Date(
          today.getFullYear() - parseInt(maxAge) - 1,
          today.getMonth(),
          today.getDate()
        ).toISOString().split("T")[0]; 
    
        query.date_of_birth = { $gte: maxBirthDate, $lte: minBirthDate };
      }
    
      let cursor = bioDataCollection.find(query);
    
      if (sortBy === "ageAsc") {
        cursor = cursor.sort({ date_of_birth: -1 });
      }
      if (sortBy === "ageDesc") {
        cursor = cursor.sort({ date_of_birth: 1 });
      }
    
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const result = await cursor.skip(skip).limit(parseInt(limit)).toArray();
    
      const today = new Date();
      result.forEach(doc => {
        const birthDate = new Date(doc.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
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
    });
    // get gender based bio
    app.get("/gender-biodatas", async (req, res) => {
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    });
    app.get('/biodatas/by-email', async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail) {
          return res.status(400).send({ error: "Email is required" });
        }
    
        const query = { contact_email: userEmail };
        const result = await bioDataCollection.findOne(query);
    
        if (!result) {
          return res.send({});
        }
    
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Server error" });
      }
    });

    // get single biodata for specific id
    app.get("/biodatas/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid IDss" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await bioDataCollection.findOne(query);
      res.send(result);
    });
    // insert biodata
    app.post("/biodatas", async (req, res) => {
      const biodata = req?.body;
      const existing = await bioDataCollection.findOne({ contact_email: biodata.contact_email });

      if (existing) {
        return res.status(400).send({ message: "Biodata already exists!" });
      }

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
    // update biodata
    app.put('/biodatas', async (req, res) => {
      const updateBio = req.body;
      const userEmail = req.query.email;
      const filter = { contact_email: userEmail };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          biodata_type: updateBio.biodata_type,
          contact_number: updateBio.contact_number,
          date_of_birth: updateBio.date_of_birth,
          expected_partner_age: updateBio.expected_partner_age,
          expected_partner_height: updateBio.expected_partner_height,
          expected_partner_weight: updateBio.expected_partner_weight,
          fathers_name: updateBio.fathers_name,
          height: updateBio.height,
          mothers_name: updateBio.mothers_name,
          name: updateBio.name,
          occupation: updateBio.occupation,
          permanent_division_name: updateBio.permanent_division_name,
          present_division_name: updateBio.present_division_name,
          profile_image: updateBio.profile_image,
          race: updateBio.race,
          weight: updateBio.weight,
        }
      }
      const result = await bioDataCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })
    // make biodata premium by user email
    app.patch('/biodatas-premium/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { contact_email: email };
      const updatedDoc = {
        $set: {
          premium_status: true
        }
      }
      const result = await bioDataCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    // END------biodata related api-------


    // START------successStory related api-------
    // get all success story
    app.get("/successStories", async (_req, res) => {
      const result = await successStoryCollection.find().toArray();
      res.send(result);
    });
    // add success story
    app.post("/successStories", async (req, res) => {
      const successStory = req.body;
      const result = await successStoryCollection.insertOne(successStory);
      res.send(result);
    })
    // END------successStory related api-------


    // START------contact request related api-------
    // get request contact info (user email get and only get)
    app.get("/contact-request", async (req, res) => {
      const userEmail = req.query.email;
      const query = { selfEmail: userEmail }
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
    app.delete('/contact-request/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })
    //  contact request status updated
    app.patch('/contact-request/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'Approved'
        }
      }
      const result = await requestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    // END------contact request related api-------


    // START------favorite related api-------
    // get all favorite data
    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await favoriteCollection.find(query).toArray();
      res.send(result);
    });
    // post by client side bioInfo
    app.post("/favorites", async (req, res) => {
      const bioInfo = req.body;
    
      const exists = await favoriteCollection.findOne({
        email: bioInfo.email,
        biodata_id: bioInfo.biodata_id
      });
    
      if (exists) {
        return res.send({ insertedId: null }); 
      }
      const result = await favoriteCollection.insertOne(bioInfo);
      res.send(result);
    });
    // delete favorites bio
    app.delete('/favorites/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    })
    // END------favorite related api-------


    // START------users related api-------
    // check admin (true or false)
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const user = await userCollection.findOne({ email });
      if (user?.role === "Admin") {
        return res.send({ admin: true });
      }
      res.send({ admin: false });
    });
    // insert user from client side
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "Already exist the email", insertedId: null, })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    // get all users by email from db
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    // delete user
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    // update user
    app.put('/users/:id', async (req, res) => {
      const userInfo = req.body;
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: userInfo.role
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })
    // END------users related api-------

    // START------premium bio related api-------
    // save premium info from client side
    app.post('/premium-bio', async (req, res) => {
      const premiumBio = req.body;
      const result = await premiumBiodataCollection.insertOne(premiumBio);
      res.send(result)
    })
    // get premium bio by email
    app.get('/premium-bio', async (req, res) => {
      const email = req.query.email;
      const query = { contact_email: email };
      const result = await premiumBiodataCollection.find(query).toArray();
      res.send(result);
    })
    // delete premium bio
    app.delete('/premium-bio/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await premiumBiodataCollection.deleteOne(query);
      res.send(result);
    })
    // END------premium bio related api-------

    // START------user stats api--------
    app.get('/user-stats', async (_req, res) => {
      const totalBiodatas = await bioDataCollection.estimatedDocumentCount();
      const successStories = await successStoryCollection.estimatedDocumentCount();
      const maleBiodatas = await bioDataCollection.countDocuments({ biodata_type: 'Male' });
      const femaleBiodatas = await bioDataCollection.countDocuments({ biodata_type: 'Female' });

      res.send({ totalBiodatas, successStories, maleBiodatas, femaleBiodatas })  
    })
    // END------user stats api--------

    // START------admin stats api--------
    app.get('/admin-stats', async (req, res) => {
      const totalBiodata = await bioDataCollection.estimatedDocumentCount();
      const maleBiodata = await bioDataCollection.countDocuments({ biodata_type: 'Male' });
      const femaleBiodata = await bioDataCollection.countDocuments({ biodata_type: 'Female' });
      const premiumBiodata = await bioDataCollection.countDocuments({ premium_status: true });
      const totalRequest = await requestCollection.find().toArray();
      const totalRevenue = totalRequest.reduce((sum, item) => sum + item.price, 0);

      res.send({ totalBiodata, maleBiodata, femaleBiodata, premiumBiodata, totalRevenue })  
    })
    // admin stats of pie chart
    app.get('/admin-pieChart-stats', async (req, res) => {
      const total_Biodata = await requestCollection.estimatedDocumentCount();
      const male = await requestCollection.countDocuments({ selfBiodata_type: 'Male' });
      const female = await requestCollection.countDocuments({ selfBiodata_type: 'Female' });
      const premium = await requestCollection.countDocuments({ selfBiodata_status: true });
      const totalRequest = await requestCollection.find().toArray();
      const revenue = totalRequest.reduce((sum, item) => sum + item.price, 0);

      res.send({ total_Biodata, male, female, premium, revenue })
    })
    // END------admin stats api--------

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!" );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (_req, res) => {
  res.send("WedlockBD server is running...");
});

app.listen(port, () => {
  console.log(`WedlockBD server is running on port : ${port}`);
});
