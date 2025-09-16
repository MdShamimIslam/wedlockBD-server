import express from "express";
import {
  getFavorites,
  addFavorite,
  deleteFavorite,
} from "../controllers/favoriteController.js";

const router = express.Router();

export default function favoritesRoutes() {
  router.get("/", getFavorites);
  router.post("/", addFavorite);
  router.delete("/:id", deleteFavorite);

  return router;
}
