app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    try {
        const foundKey = await Key.findOne({ keyCode: token });
        if (!foundKey) return res.status(401).send("Invalid Token! Please check.");

        // --- 5 Minute Testing Logic ---
        const today = new Date();
        const expiryDate = new Date(foundKey.createdAt);
        
        // 1 ki jagah 5 minute add karein
        expiryDate.setMinutes(expiryDate.getMinutes() + 5); 

        if (today > expiryDate) {
            return res.status(403).send("Token Expired! 5-minute limit over.");
        }

        // --- Device Binding Logic ---
        if (!foundKey.deviceId || foundKey.deviceId === "" || foundKey.deviceId === "null") {
            foundKey.deviceId = deviceId;
            foundKey.isUsed = true;
            await foundKey.save();
            return res.status(200).send("Success");
        }

        if (foundKey.deviceId === deviceId) {
            return res.status(200).send("Success");
        } else {
            // Iska popup bhi app mein "Used on another device!" dikhayega
            return res.status(403).send("Used on another device!");
        }

    } catch (err) {
        res.status(500).send("Server Error");
    }
});
