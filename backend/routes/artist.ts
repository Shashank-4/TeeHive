import { Router } from "express";

export const artistRouter = Router();

artistRouter.post("/signin", (req, res) => {});

artistRouter.post("/signup", (req, res) => {});

module.exports = {
    artistRouter: artistRouter,
};
