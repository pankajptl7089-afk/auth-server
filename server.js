const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 10000;

// 1. AAPKA SAHI MONGODB LINK (Password aur Database name ke saath)
const mongoURI = "mongodb+srv://pankajptl7089_db_user:P1nk1j@11@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

// Mongoose settings
mongoose.set('strictQuery', false);

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB (DMS_Database) Connected Successfully!"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 2. Schema (Aapke Atlas screenshot ke fields ke hisaab se)
const KeySchema = new mongoose.Schema({
    keyCode: String,   // Aapne 'keyCode' naam rakha hai
    deviceId: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    assignedTo: String
}, { collection: 'keys' }); // Aapka collection name 'keys' hai

const Key = mongoose.model('Key', KeySchema);

app.use(cors()); 

// 3. Verify Route
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;
    console.log(`Checking: ${token} for Device: ${deviceId}`);

    try {
        // Database mein keyCode check karna
        const foundKey = await Key.findOne({ keyCode: token });

        if (!foundKey) {
            return res.status(401).send("Invalid Token");
        }

        // Agar deviceId null hai, toh lock karo
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
