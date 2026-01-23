const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors()); // Doosre domains se request allow karne ke liye
app.use(express.json()); // JSON body read karne ke liye

// Aapka verify-token endpoint
app.get('/verify-token', async (req, res) => {
    try {
        // Yahan apna verification logic likhein
        res.status(200).json({ message: "Token verification endpoint is working!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root route (check karne ke liye ki server live hai)
app.get('/', (req, res) => {
    res.send("Auth Server is running...");
});

// Port configuration (Render ke liye process.env.PORT zaroori hai)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
