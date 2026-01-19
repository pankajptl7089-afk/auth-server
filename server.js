const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection (Standard SRV Link)
const MONGO_URI = "mongodb+srv://pankajptl7089_db_user:Pankaj%40123@cluster0.8qgtvpi.mongodb.net/DMS_Database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 Cloud Database Connected!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Database Schema
const Key = mongoose.model('Key', new mongoose.Schema({
    keyCode: { type: String, unique: true },
    isUsed: { type: Boolean, default: false },
    assignedTo: String,
    deviceId: String
}));

// 1. ADMIN API: Naya Token banane ke liye
app.get('/generate', async (req, res) => {
    const { key } = req.query;
    if(!key) return res.send("Please provide ?key=XYZ");
    try {
        await new Key({ keyCode: key }).save();
        res.send(`<h3>Token Created: <span style="color:green;">${key}</span></h3>`);
    } catch (e) { res.send("Token already exists!"); }
});

// 2. CHECK STATUS API: App isi se check karega ki password hatana hai ya nahi
app.get('/check-status', async (req, res) => {
    const { deviceId } = req.query;
    if(!deviceId) return res.json({ status: "fail" });
    
    try {
        const keyData = await Key.findOne({ deviceId: deviceId, isUsed: true });
        if (keyData) {
            res.json({ status: "success" });
        } else {
            res.json({ status: "fail" });
        }
    } catch (err) {
        res.json({ status: "error" });
    }
});

// 3. DRIVER PAGE: Login Form khulne ke liye
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

// 4. ACTIVATION LOGIC: Token verify aur success page
app.post('/activate', async (req, res) => {
    const { username, key, deviceId } = req.body;
    try {
        let keyData = await Key.findOne({ keyCode: key, isUsed: false });
        
        // Agar pehle se wahi device registered hai tab bhi success dikhao
        const alreadyActive = await Key.findOne({ keyCode: key, deviceId: deviceId });

        if (keyData || alreadyActive) {
            if(keyData) {
                keyData.isUsed = true;
                keyData.assignedTo = username;
                keyData.deviceId = deviceId;
                await keyData.save();
            }

            res.send(`
                <html>
                <body style="text-align:center;padding:50px;font-family:sans-serif;background:#e8f5e9;">
                    <div style="margin-top:100px;">
                        <h1 style="color:#2e7d32;font-size:50px;">✅</h1>
                        <h2 style="color:#1b5e20;">Activation Successful!</h2>
                        <p style="font-size:18px;color:#333;">Aapka account ab activate ho gaya hai.</p>
                        <p style="color:#666;">Ab is browser ko band karke <b>wapas App kholiye</b>.</p>
                        <br>
                        <button onclick="window.close()" style="padding:15px 30px;background:#1b5e20;color:white;border:none;border-radius:50px;font-weight:bold;">DONE / BACK</button>
                    </div>
                    <script>
                        setTimeout(function(){ 
                            window.location.href = "intent://#Intent;scheme=dms_login;package=com.jubl.dms;end"; 
                        }, 3000);
                    </script>
                </body>
                </html>
            `);
        } else {
            res.send("<h3 style='color:red;'>Invalid or Already Used Token!</h3><a href='javascript:history.back()'>Try Again</a>");
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server Live on Port " + PORT));
