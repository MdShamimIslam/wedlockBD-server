import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";
import stripePackage from "stripe";

const stripe = stripePackage(process.env.STRIPE_SK_KEY);

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

export const checkContactRequestStatus = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const biodataId = req.params?.biodataId;
    const userEmail = req.decoded?.email;

    const request = await requestCollection.findOne({
      selfEmail: userEmail,
      partnerBiodataId: parseInt(biodataId),
      status: "approved" 
    });

    if (request) {
      return res.status(200).json({ success: true, requested: true });
    }
    res.status(200).json({ success: true, requested: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to check request status" });
  }
};

export const getAllContactRequests = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const result = await requestCollection.find({}).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch all contact requests" });
  }
};

export const addContactRequest = async (req, res) => {
  try {
    const { bioDataCollection, requestCollection } = getCollections();
    const biodataId = req.params?.biodataId;
    const userEmail = req.decoded?.email;
    const biodata = await bioDataCollection.findOne({ biodata_id: parseInt(biodataId) });
    const selfBioData = await bioDataCollection.findOne({ contact_email: userEmail });
    
    if (!biodata) return res.status(404).json({ success: false, message: "Profile not found" });
    
    if (biodata.contact_email === userEmail) return res.status(400).json({ success: false, message: "You cannot request your own profile" });
   
    const existingRequest = await requestCollection.findOne({ selfEmail: userEmail, partnerEmail: biodata.contact_email });
    if (existingRequest) return res.status(400).json({ success: false, message: "You have already requested this profile" });

    const price = 1;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
      cancel_url: `${req.protocol}://${req.get("host")}/biodatas/${biodataId}`,
      customer_email: userEmail,
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

      await requestCollection.insertOne({
        selfEmail: userEmail,
        selfName: selfBioData?.name,
        selfImg: selfBioData?.profile_image,
        partnerBiodataId: biodata.biodata_id,
        partnerName: biodata?.name,
        partnerImg: biodata?.profile_image,
        partnerNumber: biodata?.contact_number,
        partnerEmail: biodata?.contact_email,
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
};

export const updateContactRequestStatus = async (req, res) => {
  try {
    const { requestCollection } = getCollections();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const updatedDoc = { $set: { status: "approved" } };
    const result = await requestCollection.updateOne({ _id: new ObjectId(id) }, updatedDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to update contact request status" });
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



