// --- 1 Minute Testing Limit Check ---
const today = new Date();
const expiryDate = new Date(foundKey.createdAt);

// 30 din ki jagah 1 minute add karein
expiryDate.setMinutes(expiryDate.getMinutes() + 1); 

if (today > expiryDate) {
    return res.status(403).send("Token Expired! 1 minute over.");
}
// -----------------------------
