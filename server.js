const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Final Simple SRV Connection String
const MONGO_URI = "mongodb+srv://pankajptl7089_db_user:Pankaj%40123@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Cloud Database Connected!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Database Schema for Keys
const Key = mongoose.model('Key', new mongoose.Schema({
    keyCode: { type: String, unique: true },
    isUsed: { type: Boolean, default: false },
    assignedTo: String,
    deviceId: String
}));

// API: Token Banane ke liye (Admin)
app.get('/generate', async (req, res) => {
    const { key } = req.query;
    if(!key) return res.send("Please provide ?key=XYZ");
    try {
        await new Key({ keyCode: key }).save();
        res.send(`<h3>Token Created: <span style="color:green;">${key}</span></h3>`);
    } catch (e) { res.send("Token already exists!"); }
});

// PAGE: Activation Form (Driver side)
app.get('/app-login', (req, res) => {
    const deviceId = req.query.deviceId || "Unknown";
    res.send(`
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="text-align:center; padding:30px; font-family:sans-serif; background:#f4f4f4;">
            <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); max-width:400px; margin:auto;">
                <h2>DMS Activation</h2>
                <p>Device ID: <span style="color:blue;">${deviceId}</span></p>
                <form action="/activate" method="POST">
                    <input type="hidden" name="deviceId" value="${deviceId}">
                    <input type="text" name="username" placeholder="Aapka Naam" required style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:5px;"><br>
                    <input type="text" name="key" placeholder="Enter Key Token" required style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:5px;"><br>
                    <button type="submit" style="width:100%; padding:12px; background:#28a745; color:white; border:none; border-radius:5px; font-size:16px;">ACTIVATE NOW</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// LOGIC: Token Verify aur Device Bind karna
app.post('/activate', async (req, res) => {
    const { username, key, deviceId } = req.body;
    try {
        // Check if token is valid and not used
        const keyData = await Key.findOne({ keyCode: key, isUsed: false });
        
        if (keyData) {
            keyData.isUsed = true;
            keyData.assignedTo = username;
            keyData.deviceId = deviceId;
            await keyData.save();
            res.redirect('http://login.success');
        } else {
            // Check if device is already registered with this token
            const alreadyActive = await Key.findOne({ keyCode: key, deviceId: deviceId });
            if(alreadyActive) {
                return res.redirect('http://login.success');
            }
            res.send("<h3 style='color:red;'>Invalid or Already Used Token!</h3><a href='javascript:history.back()'>Try Again</a>");
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server Live on Port " + PORT));
