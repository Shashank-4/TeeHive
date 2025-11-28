import { Router } from "express";

export const userRouter = Router();

userRouter.post("/signin", (req, res) => {});

userRouter.post("/signup", (req, res) => {});

module.exports = {
    userRouter: userRouter,
};
