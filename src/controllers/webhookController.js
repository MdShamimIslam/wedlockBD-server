import stripePackage from "stripe";
import { getCollections } from "../config/db.js";

const stripe = stripePackage(process.env.STRIPE_SK_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.trim() : '';
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { requestCollection, premiumBiodataCollection, bioDataCollection } = getCollections();

    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500));

      if (session.metadata && session.metadata.type === 'contactRequest') {
        const userEmail = session.metadata.userEmail;
        const biodataId = parseInt(session.metadata.biodataId);

        const selfBioData = await bioDataCollection.findOne({ contact_email: userEmail });
        const biodata = await bioDataCollection.findOne({ biodata_id: biodataId });

        if (biodata && selfBioData) {
          const result = await requestCollection.updateOne(
            { sessionId: session.id },
            {
              $setOnInsert: {
                selfEmail: userEmail,
                selfName: selfBioData.name,
                selfImg: selfBioData.profile_image,
                partnerBiodataId: biodata.biodata_id,
                partnerName: biodata.name,
                partnerImg: biodata.profile_image,
                partnerNumber: biodata.contact_number,
                partnerEmail: biodata.contact_email,
                price: 1,
                status: "pending",
                createdAt: new Date(),
              }
            },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            console.log(`Contact request inserted via webhook for ${userEmail}`);
          } else {
            console.log(`Duplicate contact request webhook ignored for ${session.id}`);
          }
        }
      } else if (session.metadata && session.metadata.type === 'premiumBio') {
        const biodataId = parseInt(session.metadata.biodataId);
        const biodata = await bioDataCollection.findOne({ biodata_id: biodataId });

        if (biodata) {
          const result = await premiumBiodataCollection.updateOne(
            { sessionId: session.id },
            {
              $setOnInsert: {
                biodata_id: biodata.biodata_id,
                contact_email: biodata.contact_email,
                name: biodata.name,
                payment_status: "pending",
                payment_date: new Date(),
              }
            },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            console.log(`Premium bio request inserted via webhook for biodataId ${biodataId}`);
          } else {
            console.log(`Duplicate premium bio webhook ignored for ${session.id}`);
          }
        }
      }
    } catch (dbError) {
      console.error(`Database Error in Webhook: ${dbError.message}`);
      return res.status(500).send(`Database Error: ${dbError.message}`);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send('Webhook received');
};
