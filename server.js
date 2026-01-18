express();B Connection Error:", err));

const Key = mongoose.model('Key', new mongoose.Schema({
    keyCode: { type: String, unique: true },key } = req.query;
    if(!key) return res.send("Please provide ?key=XYZ");
    try {
        await new Key({ keyCode: key }).save();
        res.send(`<h3>Token Created: <span style="color:green;">${key}</span></h3>`);
    } catch (e) { res.send("Token already exists!"); }
});

app.get('/app-login', (req, res) => {
    const deviceId = req.query.deviceId || "Unknown";
    res.send(`
        <html><body style="text-align:center;padding:30px;font-family:sans-serif;">
            <h2>DMS Activation</h2>
            <p>Device ID: ${deviceId}</p>
            <form action="/activate" method="POST">
                <input type="hidden" name="deviceId" value="${deviceId}">
                <input type="text" name="username" placeholder="Your Name" required style="padding:10px;width:80%;"><br><br>
                <input type="text" name="key" placeholder="Enter Key Token" required style="padding:10px;width:80%;"><br><br>
                <button type="submit" style="padding:10px;width:85%;background:green;color:white;">ACTIVATE NOW</button>
            </form>
        </body></html>
    `);
});

app.post('/activate', async (req, res) => {
    const { username, key, deviceId } = req.body;
    const keyData = await Key.findOne({ keyCode: key, isUsed: false });
    if (keyData) {
        keyData.isUsed = true;
        keyData.assignedTo = username;
        keyData.deviceId = deviceId;
        await keyData.save();
        res.redirect('http://login.success');
    } else {
        res.send("<h3 style='color:red;'>Invalid Token!</h3>");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server Live on Port " + PORT));

