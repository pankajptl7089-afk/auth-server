const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const dbURI = "mongodb+srv://pankajptl7089_db_user:Pankaj%40123@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err.message));

// --- SCHEMAS ---
const KeySchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    expiryDate: { type: Date }
});
const Key = mongoose.model('Key', KeySchema, 'keys');

const NoticeSchema = new mongoose.Schema({
    isBlock: { type: Boolean, default: false },
    noticeMsg: { type: String, default: "Your subscription plan end please renew plan" },
    showWarning: { type: Boolean, default: true } // Yahan se aap warning ON/OFF karenge
});
const Notice = mongoose.model('Notice', NoticeSchema, 'app_notice');

// --- 1. CHECK APP STATUS ---
app.get('/check-status', async (req, res) => {
    try {
        let statusData = await Notice.findOne();
        if (!statusData) return res.json({ isBlock: false, noticeMsg: "", showWarning: true });
        res.json(statusData);
    } catch (error) {
        res.status(500).json({ error: "Database Error" });
    }
});

// --- 2. VERIFY TOKEN (Targeted Warning Logic) ---
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;
    if (!token || !deviceId) return res.status(400).json({ status: "Error", message: "Parameters missing!" });

    try {
        const keyData = await Key.findOne({ token: token });
        const noticeData = await Notice.findOne(); 

        if (!keyData) return res.status(404).json({ status: "Error", message: "Invalid Token" });

        const now = new Date();
        
        // 1. Expiry Check
        if (keyData.expiryDate && now > new Date(keyData.expiryDate)) {
            return res.status(403).json({ status: "Expired", message: "Your subscription plan end please renew plan" });
        }

        // 2. Targeted Warning Logic (1 din bacha hai + Global Switch check)
        let warningMsg = null;
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const timeLeft = new Date(keyData.expiryDate) - now;

        // Sirf tabhi warning jayegi agar:
        // A) Database mein 'showWarning' true ho
        // B) Expiry mein 1 din ya usse kam bacha ho
        if (noticeData && noticeData.showWarning === true && timeLeft <= oneDayInMs && timeLeft > 0) {
            warningMsg = "Savdhan! Aapka subscription kal khatam ho jayega. Please renew karein.";
        }

        // 3. New Activation
        if (!keyData.isUsed || keyData.deviceId === "" || keyData.deviceId === "null") {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            keyData.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
            await keyData.save();
            return res.status(200).json({ status: "Success", message: "Activated Successfully" });
        }

        // 4. Device Lock Check
        if (keyData.deviceId === deviceId) {
            return res.status(200).json({ 
                status: "Success", 
                message: warningMsg || "Success" 
            });
        } else {
            return res.status(403).json({ status: "Error", message: "Locked to another device!" });
        }
    } catch (error) {
        res.status(500).json({ status: "Error", message: "Server Error: " + error.message });
    }
});

app.get('/', (req, res) => {
    res.send("Auth Server is Live!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
