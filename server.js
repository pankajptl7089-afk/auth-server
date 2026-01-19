const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 10000;

// 1. AAPKA FINAL SAHI MONGODB LINK
// Dhyan dein: 'mongodb' small letters mein hai aur password/database name sahi hai.
const mongoURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j@11@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

// Mongoose settings
mongoose.set('strictQuery', false);

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB (DMS_Database) Connected Successfully!"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 2. Schema (Aapke Atlas 'keys' collection ke hisaab se)
const KeySchema = new mongoose.Schema({
    keyCode: String,
    deviceId: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    assignedTo: String
}, { collection: 'keys' });

const Key = mongoose.model('Key', KeySchema);

app.use(cors()); 
app.use(express.json());

// 3. Verify Route
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;
    console.log(`Checking: ${token} for Device: ${deviceId}`);

    try {
        const foundKey = await Key.findOne({ keyCode: token });

        if (!foundKey) {
            return res.status(401).send("Invalid Token");
        }

        // Agar deviceId null hai, toh naya device lock karo
        if (!foundKey.deviceId || foundKey.deviceId === "" || foundKey.deviceId === "null") {
            foundKey.deviceId = deviceId;
            foundKey.isUsed = true;
            await foundKey.save();
            console.log("New device locked!");
            return res.sendStatus(200);
        }

        // Agar device match karta hai, toh OK
        if (foundKey.deviceId === deviceId) {
            return res.sendStatus(200);
        } else {
            console.log("Device Mismatch!");
            return res.status(403).send("Used on another device");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.listen(port, () => console.log(`🚀 Server is live on port ${port}`));

