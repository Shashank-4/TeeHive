import express from "express";

const app = express();

const PORT = process.env.port || 3000;

app.get("/", (req, res) => {
    res.send("Hello from the backend");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
