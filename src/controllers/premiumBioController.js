import { ObjectId } from "mongodb";
import { getCollections } from "../config/db.js";

import stripePackage from "stripe";
const stripe = stripePackage(process.env.STRIPE_SK_KEY);

export const addPremiumBio = async (req, res) => {
  try {
    const { bioDataCollection, premiumBiodataCollection } = getCollections();
    const biodataId = req.params.biodataId;
    const biodata = await bioDataCollection.findOne({ biodata_id: parseInt(biodataId) });
    const hasPremiumBio = await premiumBiodataCollection.findOne({ biodata_id: parseInt(biodataId) });

    if (!biodata) return res.status(404).json({ success: false, message: "Profile not found" });

    if (hasPremiumBio) return res.status(400).json({ success: false, message: "Already requested" });

    const price = 10;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
      cancel_url: `${req.protocol}://${req.get("host")}/biodatas/${biodataId}`,
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

    await premiumBiodataCollection.insertOne({
      biodata_id: biodata.biodata_id,
      contact_email: biodata.contact_email,
      name: biodata.name,
      payment_status: "pending",
      payment_date: new Date()
    })

    res.status(200).json({ success: true, session });

  } catch (err) {
    console.error("Stripe checkout-session error:", err);
    res.status(500).json({ success: false, message: "Failed to create checkout session" });
  }
};

export const getPremiumBio = async (_req, res) => {
  try {
    const { premiumBiodataCollection } = getCollections();
    const result = await premiumBiodataCollection.find({}).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch premium bio" });
  }
};

export const updatePremiumBioStatus = async (req, res) => {
  try {
    const { bioDataCollection, premiumBiodataCollection } = getCollections();
    const biodataId = parseInt(req.params.biodataId);

    const biodata = await premiumBiodataCollection.findOne({ biodata_id: biodataId });
    if (!biodata) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (biodata.payment_status === "approved") {
      return res.status(200).json({ success: false, message: "This profile is already Premium." });
    }

    const premiumResult = await premiumBiodataCollection.updateOne(
      { biodata_id: biodataId },
      { $set: { payment_status: "approved" } }
    );

    const mainResult = await bioDataCollection.updateOne(
      { biodata_id: biodataId },
      { $set: { premium_status: true } }
    );

    if (premiumResult.modifiedCount > 0 || mainResult.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Premium biodata approved successfully!",
        premiumResult,
        mainResult,
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No changes made. This profile might already be Premium.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update premium bio status" });
  }
};

export const deletePremiumBio = async (req, res) => {
  try {
    const { premiumBiodataCollection } = getCollections();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID" });
    }
    const result = await premiumBiodataCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to delete premium bio" });
  }
};
