import express from "express";

const app = express();

app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.json({
    message: "Hello from AfkBot",
    uptime: process.uptime().toFixed(2) + " seconds",
    ip: req.ip,
    secure: req.secure,
    protocol: req.protocol,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
