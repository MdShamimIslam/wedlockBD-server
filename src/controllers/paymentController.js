import { getCollections } from "../config/db.js";
import stripePackage from "stripe";

const stripe = stripePackage(process.env.STRIPE_SK_KEY);

export const makePremium = async (req, res) => {
  try {
    const { bioDataCollection } = getCollections();
    const biodataId = req.params.biodataId;
    const biodata = await bioDataCollection.findOne({ biodata_id: parseInt(biodataId) });

    if (!biodata) return res.status(404).json({ success: false, message: "Profile not found" });

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

    const updatedDoc = { $set: { premium_status: true } };
    await bioDataCollection.updateOne({ biodata_id: parseInt(biodataId) }, updatedDoc);

    res.status(200).json({ success: true, session });

  } catch (err) {
    console.error("Stripe checkout-session error:", err);
    res.status(500).json({ success: false, message: "Failed to create checkout session" });
  }
};
