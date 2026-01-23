// 1 Ghante wala Token banane ke liye Admin Route
app.post('/generate', async (req, res) => {
    const { token } = req.body; // Sirf token ka naam bhejein
    
    const expiry = new Date();
    // 1 Ghante (60 minutes) ka time set karne ke liye
    expiry.setHours(expiry.getHours() + 1); 

    try {
        const newToken = new Token({ 
            token: token, 
            expiryDate: expiry,
            isActive: true 
        });
        await newToken.save();
        res.status(200).json({ 
            message: "Token Created for 1 Hour!", 
            expiresAt: expiry.toLocaleString() 
        });
    } catch (err) {
        res.status(500).json({ error: "Token already exists or DB Error" });
    }
});
