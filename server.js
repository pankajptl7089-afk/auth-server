app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;
    try {
        const foundKey = await Key.findOne({ keyCode: token });
        if (!foundKey) return res.status(401).send("Invalid Token!");

        const expiryDate = new Date(foundKey.createdAt);
        expiryDate.setMinutes(expiryDate.getMinutes() + 5); // 5 Minute Expiry

        if (new Date() > expiryDate) {
            return res.status(403).send("Expired! Get a new key.");
        }

        // Device match check
        if (!foundKey.deviceId || foundKey.deviceId === deviceId) {
            foundKey.deviceId = deviceId;
            await foundKey.save();
            return res.status(200).send("Success");
        } else {
            return res.status(403).send("Used on another device!");
        }
    } catch (err) { res.status(500).send("Server Error"); }
});
