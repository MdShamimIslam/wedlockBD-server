import jwt from "jsonwebtoken";


export const createToken = (req, res) => {
  try {
    const userEmail = req.body;
    const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
      expiresIn: "1d",
    });
    res.send({ token });
  } catch (err) {
    res.status(500).send({ error: "Failed to generate token" });
  }
};
