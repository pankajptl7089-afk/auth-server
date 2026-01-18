const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DNS-Bypass Connection String
const MONGO_URI = "mongodb://pankajptl7089_db_user:sePLdlQgNyoP6sX1@cluster0-shard-00-00.8qgtvpi.mongodb.net:27017,cluster0-shard-00-01.8qgtvpi.mongodb.net:27017,cluster0-shard-00-02.8qgtvpi.mongodb.net:27017/DMS_Database?ssl=true&replicaSet=atlas-8qgtvpi-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Cloud Database Connected!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Database Schema
const Key = mongoose.model('Key', new mongoose.Schema({
    keyCode: { type: String, unique: true },
    isUsed: { type: Boolean, default: false },
    assignedTo: String,
    deviceId: String
}));

// 1. ADMIN: Token banane ke liye (Example: /generate?key=PANKAJ-777)
app.get('/generate', async (req, res) => {
    const { key } = req.query;
    if(!key) return res.send("Please provide a key in URL, e.g., ?key=ABC-123");
    try {
        await new Key({ keyCode: key }).save();
        res.send(`<h3>Token Created: <span style="color:green;">${key}</span></h3><p>Ab ye key user ko de dein.</p>`);
    } catch (e) { res.send("Token already exists!"); }
});

// 2. PAGE: Activation Form (Driver ko dikhega)
app.get('/app-login', (req, res) => {
    const deviceId = req.query.deviceId || "Unknown";
    res.send(`
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="text-align:center; padding:30px; font-family:sans-serif; background:#f4f4f4;">
            <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); max-width:400px; margin:auto;">
                <h2>DMS Activation</h2>
                <p>Device ID: <span style="color:blue;">${deviceId}</span></p>
                <form action="/activate" method="POST">
                    <input type="hidden" name="deviceId" value="${deviceId}">
                    <input type="text" name="username" placeholder="Aapka Naam" required style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:5px;"><br>
                    <input type="text" name="key" placeholder="Enter Key Token" required style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:5px;"><br>
                    <button type="submit" style="width:100%; padding:12px; background:#28a745; color:white; border:none; border-radius:5px; font-size:16px;">ACTIVATE NOW</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 3. LOGIC: Activation & Binding
