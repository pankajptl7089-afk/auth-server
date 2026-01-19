const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 10000;

const mongoURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j%4011@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.set('strictQuery', false);
mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected with Expiry System!"))
    .catch(err => console.log("❌ Connection Error:", err));

const KeySchema = new mongoose.Schema({
    keyCode: String,
    deviceId: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    assignedTo: String,
    createdAt: { type: Date, default: Date.now } // Token kab bana uski date
}, { collection: 'keys' });

const Key = mongoose.model('Key', KeySchema);

app.use(cors());
app.use(express.json());

app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        const foundKey = await Key.findOne({ keyCode: token });
        if (!foundKey) return res.status(401).send("Invalid Token");

        // --- 30 Din ki Limit Check ---
        const today = new Date();
        const expiryDate = new Date(foundKey.createdAt);
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 din jodein

        if (today > expiryDate) {
            return res.status(403).send("Token Expired! Please renew.");
        }
        // -----------------------------

        if (!foundKey.deviceId || foundKey.deviceId === "" || foundKey.deviceId === "null") {
            foundKey.deviceId = deviceId;
            foundKey.isUsed = true;
            await foundKey.save();
            return res.sendStatus(200);
        }

        if (foundKey.deviceId === deviceId) return res.sendStatus(200);
        else return res.status(403).send("Used on another device");

    } catch (err) {
        res.status(500).send("Server Error");
    }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
