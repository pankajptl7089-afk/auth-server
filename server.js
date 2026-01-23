const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'YOUR_MONGODB_URI')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("DB Error:", err));

// 2. Schema mein 'expiresAt' add kiya hai
const KeySchema = new mongoose.Schema({
    keyCode: String,
    deviceId: String,
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // Validity khatam hone ka time
    durationInHours: { type: Number, default: 1 } // Default 1 ghanta
});

const Key = mongoose.model('Key', KeySchema);

// 3. Verify Token Endpoint
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        const keyData = await Key.findOne({ keyCode: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();

        // Check if Expired: Agar expiresAt set hai aur abhi ka waqt usse zyada hai
        if (keyData.expiresAt && now > keyData.expiresAt) {
            return res.status(403).send("Token Expired!");
        }

        // Pehli baar use ho raha hai (Activation)
        if (!keyData.isUsed) {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            
            // Abhi se 1 ghanta baad ka time set karein
            const expiryTime = new Date();
            expiryTime.setHours(expiryTime.getHours() + keyData.durationInHours);
            keyData.expiresAt = expiryTime;

            await keyData.save();
            return res.status(200).send("Activated for 1 Hour");
        }

        // Purana user check (Wahi device hona chahiye aur expired nahi hona chahiye)
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("Locked to another device");
        }

    } catch (error) {
        res.status(500).send("Server Error");
    }
});

// Test API: Naya 1 ghante ka token banane ke liye (Sirf testing ke liye)
app.post('/generate-key', async (req, res) => {
    const { code } = req.body;
    const newKey = new Key({
        keyCode: code,
        durationInHours: 1 // Yahan aap ghante badha sakte hain
    });
    await newKey.save();
    res.send(`Key Created: ${code} (Valid for 1 hour after first use)`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
