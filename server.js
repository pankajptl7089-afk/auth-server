const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- AAPKA DATABASE CONNECTION ---
const dbURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// Database Schema
const KeySchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    expiryDate: { type: Date }
});

const Key = mongoose.model('Key', KeySchema, 'keys');

// --- VERIFY TOKEN ENDPOINT ---
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    if (!token || !deviceId) {
        return res.status(400).send("Parameters missing!");
    }

    try {
        // 1. Database mein token dhoondhein
        const keyData = await Key.findOne({ token: token });

        if (!keyData) {
            console.log(`Access Denied: Token ${token} not found.`);
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();

        // 2. Expiry Check
        if (keyData.expiryDate && now > new Date(keyData.expiryDate)) {
            return res.status(403).send("Token Expired!");
        }

        // 3. Activation Logic (Pehli baar ke liye)
        if (!keyData.isUsed || keyData.deviceId === "" || keyData.deviceId === "null") {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            
            // Aaj se 30 din ki expiry set karein
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            keyData.expiryDate = thirtyDays;

            await keyData.save();
            return res.status(200).send("Activated Successfully");
        }

        // 4. Device Lock Check
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("Locked to another device!");
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send("Server Error");
    }
});

app.get('/', (req, res) => {
    res.send("Auth Server is Live with 30-Day Validation!");
});

// --- SERVER START LOGIC (Render & Vercel Compatibility) ---
const PORT = process.env.PORT || 10000;

// Render/Local ke liye:
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// Vercel ke liye:
module.exports = app;
