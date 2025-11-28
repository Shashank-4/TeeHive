import { Router } from "express";

export const adminRouter = Router();

adminRouter.post("/signin", (req, res) => {});

adminRouter.post("/signup", (req, res) => {});

module.exports = {
    adminRouter: adminRouter,
};
