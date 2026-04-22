const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const dbURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- 1. KEY SCHEMA (Auth Logic) ---
const KeySchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    expiryDate: { type: Date }
});
const Key = mongoose.model('Key', KeySchema, 'keys');

// --- 2. NOTICE SCHEMA (Admin Control) ---
// Isse aap message aur block status control karenge
const NoticeSchema = new mongoose.Schema({
    isBlock: { type: Boolean, default: false },
    noticeMsg: { type: String, default: "Your subscription plan end please renew plan" }
});
const Notice = mongoose.model('Notice', NoticeSchema, 'app_notice');


// --- 3. CHECK APP STATUS ENDPOINT ---
// Android app sabse pehle ise call karegi
app.get('/check-status', async (req, res) => {
    try {
        let statusData = await Notice.findOne();
        if (!statusData) {
            // Agar DB khali hai toh default data bhej do
            return res.json({ isBlock: false, noticeMsg: "" });
        }
        res.json(statusData);
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

// --- 4. VERIFY TOKEN ENDPOINT ---
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    if (!token || !deviceId) {
        return res.status(400).send("Parameters missing!");
    }

    try {
        const keyData = await Key.findOne({ token: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();

        // Expiry Check
        if (keyData.expiryDate && now > new Date(keyData.expiryDate)) {
            return res.status(403).send("Your subscription plan end please renew plan");
        }

        // Activation Logic
        if (!keyData.isUsed || keyData.deviceId === "" || keyData.deviceId === "null") {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            keyData.expiryDate = thirtyDays;

            await keyData.save();
            return res.status(200).send("Activated Successfully");
        }

        // Device Lock Check
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("Locked to another device!");
        }

    } catch (error) {
        res.status(500).send("Server Error");
    }
});

app.get('/', (req, res) => {
    res.send("Auth Server is Live with Admin Notice Control!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
