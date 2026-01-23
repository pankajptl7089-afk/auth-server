const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection (Aapka Password aur Cluster updated hai)
const dbURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/auth_database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// 2. Data Schema
const KeySchema = new mongoose.Schema({
    keyCode: { type: String, required: true },
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    assignedTo: { type: String, default: "User1" },
    createdAt: { type: Date, default: Date.now }
});

const Key = mongoose.model('Key', KeySchema);

// 3. Verify Token Endpoint (1 Hour Expiry Logic)
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        // Database mein token dhundein
        const keyData = await Key.findOne({ keyCode: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();
        const createdTime = new Date(keyData.createdAt);
        
        // 1 Hour Expiry Check (60 minutes = 3600000 milliseconds)
        const diffInMs = now - createdTime;
        const oneHourInMs = 60 * 60 * 1000;

        // Agar token used hai aur 1 ghanta beet chuka hai
        if (keyData.isUsed && diffInMs > oneHourInMs) {
            return res.status(403).send("Token Expired (1 Hour Over)");
        }

        // --- Activation Logic ---
        // Agar naya token hai, toh device lock karein aur time reset karein
        if (!keyData.isUsed) {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            keyData.createdAt = new Date(); // Yahan se 1 ghanta shuru hoga
            await keyData.save();
            return res.status(200).send("Activated for 1 Hour");
        }

        // --- Re-Login Logic ---
        // Agar pehle se use ho raha hai, toh check karein wahi device hai ya nahi
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("This token is locked to another device!");
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send("Auth Server is running...");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
