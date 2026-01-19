const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Render ke Environment Variable se link uthayega
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB (DMS_Database) Connected Successfully!"))
    .catch(err => console.log("MongoDB Connection Error:", err));

// Aapke Atlas screenshot ke hisaab se Schema
const KeySchema = new mongoose.Schema({
    keyCode: String,
    deviceId: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    assignedTo: String
}, { collection: 'keys' });

const Key = mongoose.model('Key', KeySchema);

app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;
    console.log(`Verifying: ${token} for Device: ${deviceId}`);

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

app.listen(port, () => console.log(`Server is live on port ${port}`));

