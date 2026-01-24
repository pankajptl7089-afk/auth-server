// 3. Verify Token Endpoint (30 Days Expiry Logic)
app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        const keyData = await Key.findOne({ keyCode: token });

        if (!keyData) {
            return res.status(404).send("Invalid Token");
        }

        const now = new Date();
        const createdTime = new Date(keyData.createdAt);
        
        // --- 30 Days Expiry Logic ---
        // 30 din = 30 * 24 ghante * 60 minute * 60 second * 1000 millisecond
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const diffInMs = now - createdTime;

        // Agar token pehle use ho chuka hai aur 30 din beet gaye hain
        if (keyData.isUsed && diffInMs > thirtyDaysInMs) {
            return res.status(403).send("Token Expired (30 Days Over)");
        }

        // --- Activation Logic ---
        if (!keyData.isUsed) {
            keyData.isUsed = true;
            keyData.deviceId = deviceId;
            keyData.createdAt = new Date(); // Pehli baar use karte hi 30 din ka timer shuru
            await keyData.save();
            return res.status(200).send("Activated for 30 Days");
        }

        // --- Re-Login Logic ---
        if (keyData.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("This token is locked to another device!");
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send("Server Error");
    }
});
