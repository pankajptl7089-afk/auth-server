app.get('/verify-token', async (req, res) => {
    const { token, deviceId } = req.query;

    // Yahan aap apne database (MongoDB) se user dhundenge
    // Maan lijiye 'user' object mil gaya
    const user = await User.findOne({ token: token });

    if (!user) {
        return res.status(401).send("Invalid"); // Token galat hai
    }

    // Expiry Check (Maan lijiye user.expiry ek date hai)
    const currentTime = new Date();
    if (currentTime > user.expiry) {
        return res.status(403).send("Expired"); // Token expire ho gaya
    }

    if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).send("Device Mismatch");
    }

    res.status(200).send("OK"); // Sab sahi hai
});
