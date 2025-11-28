import express from "express";
import { userRouter } from "./routes/user";
import { adminRouter } from "./routes/admin";
import { artistRouter } from "./routes/artist";
const PORT = process.env.port || 3000;
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from the backend");
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/artist", artistRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
