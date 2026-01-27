const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection
const dbURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// 2. Schema Fix: Screenshot ke mutabik fields set ki hain
const KeySchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true }, // 'keyCode' ko 'token' kiya
    deviceId: { type: String, default: "" },
    isUsed: { type: Boolean, default: false },
    expiryDate: { type: Date } // Expiry date field
});

const Key = mongoose.model('Key', KeySchema, 'keys');

// 3. Verify Token Endpoint (30 Days Version)
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        // Database mein 'token' field se search karein
        const keyData = await Key.findOne({ token: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();

        // --- Expiry Logic Check ---
        if (keyData.expiryDate && now > new Date(keyData.expiryDate)) {
            return res.status(403).send("Token Expired!");
        }

        // --- Activation Logic (Pehli Baar Use) ---
        if (!keyData.isUsed || keyData.deviceId === "" || keyData.deviceId === "null") {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            
            // Agar pehle se expiry set nahi hai, toh aaj se 30 din set karein
            if (!keyData.expiryDate) {
                const thirtyDays = new Date();
                thirtyDays.setDate(thirtyDays.getDate() + 30);
                keyData.expiryDate = thirtyDays;
            }

            await keyData.save();
            return res.status(200).send("Activated Successfully");
        }

        // --- Re-Login / Device Lock Logic ---
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
    res.send("Auth Server Live: 30 Days Expiry Logic Active!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
