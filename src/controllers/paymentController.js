import { getCollections } from "../config/db.js";
import stripePackage from "stripe";

const stripe = stripePackage(process.env.STRIPE_SK_KEY);

export const contactCheckoutSession = async (req, res) => {
  try {
    const { bioDataCollection, userCollection, premiumBiodataCollection } = getCollections();

    const biodataId = req.params.biodataId;
    const userEmail = req.decoded.email;

    const biodata = await bioDataCollection.findOne({ biodata_id: parseInt(biodataId) });
    const user = await userCollection.findOne({ email: userEmail });

    if (!biodata) return res.status(404).json({ success: false, message: "Profile not found" });

    const price = 1;

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
};
