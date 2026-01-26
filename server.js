const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection
// यहाँ सुनिश्चित करें कि /DMS_Database? सही जगह पर लिखा हो
const dbURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully to DMS_Database"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// 2. Data Schema & Model
const KeySchema = new mongoose.Schema({
    keyCode: { type: String, required: true },
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    assignedTo: { type: String, default: "User1" },
    createdAt: { type: Date, default: Date.now }
});

// ✅ यहाँ हमने 'keys' कलेक्शन को स्पष्ट रूप से नाम दिया है
const Key = mongoose.model('Key', KeySchema, 'keys'); 

// 3. Verify Token Endpoint (30 Days Expiry)
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        const keyData = await Key.findOne({ keyCode: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();
        const createdTime = new Date(keyData.createdAt);
        
        // --- 30 Days Expiry Logic ---
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const diffInMs = now - createdTime;

        // अगर टोकन इस्तेमाल हो चुका है और 30 दिन बीत गए हैं
        if (keyData.isUsed && diffInMs > thirtyDaysInMs) {
            return res.status(403).send("Token Expired (30 Days Over)");
        }

        // --- Activation Logic ---
        if (!keyData.isUsed) {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            keyData.createdAt = new Date(); // एक्टिवेशन के समय से 30 दिन शुरू
            await keyData.save();
            return res.status(200).send("Activated for 30 Days");
        }

        // --- Re-Login Logic ---
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("This token is locked to another device!");
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send("Server Error");
    }
});

app.get('/', (req, res) => {
    res.send("Auth Server is live and connected to DMS_Database!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

