import { getCollections } from "../config/db.js";

export const getAdminStats = async (_req, res) => {
  try {
    const { bioDataCollection, requestCollection } = getCollections();

    const totalBiodata = await bioDataCollection.estimatedDocumentCount();
    const maleBiodata = await bioDataCollection.countDocuments({ biodata_type: "Male" });
    const femaleBiodata = await bioDataCollection.countDocuments({ biodata_type: "Female" });
    const premiumBiodata = await bioDataCollection.countDocuments({ premium_status: true });

    const totalRequest = await requestCollection.find().toArray();
    const totalRevenue = totalRequest.reduce((sum, item) => sum + item.price, 0);

    res.send({ totalBiodata, maleBiodata, femaleBiodata, premiumBiodata, totalRevenue });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch admin stats" });
  }
};

export const getAdminPieChartStats = async (_req, res) => {
  try {
    const { requestCollection } = getCollections();

    const total_Biodata = await requestCollection.estimatedDocumentCount();
    const male = await requestCollection.countDocuments({ selfBiodata_type: "Male" });
    const female = await requestCollection.countDocuments({ selfBiodata_type: "Female" });
    const premium = await requestCollection.countDocuments({ selfBiodata_status: true });

    const totalRequest = await requestCollection.find().toArray();
    const revenue = totalRequest.reduce((sum, item) => sum + item.price, 0);

    res.send({ total_Biodata, male, female, premium, revenue });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch admin pie chart stats" });
  }
};
