const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware taaki JSON aur URL encoded data samajh sake server
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. TOKEN VERIFICATION ROUTE (App ke liye) ---
// Jab driver app me Verify dabayega, app yahan contact karegi
app.get('/verify-token', (req, res) => {
    const userToken = req.query.token;
    const secureToken = "DMS_NEW_2026"; // <--- Isse aap kabhi bhi badal sakte hain

    console.log(`Verification attempt with token: ${userToken}`);

    if (userToken === secureToken) {
        // Status 200 ka matlab hai App me Dashboard khul jayega
        res.sendStatus(200);
    } else {
        // Status 401 ka matlab hai App "Invalid Token" dikhayegi
        res.sendStatus(401);
    }
});

// --- 2. HOME PAGE (Testing ke liye) ---
app.get('/', (req, res) => {
    res.send('<h1>DMS Auth Server is Live!</h1><p>Token verification endpoint is active.</p>');
});

// --- 3. LOGIN PAGE (Browser wala logic agar backup ke liye chahiye) ---
app.get('/app-login', (req, res) => {
    const deviceId = req.query.deviceId;
    res.send(`
        <html>
            <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                <h2>Device Activation</h2>
                <p>Device ID: <b>${deviceId}</b></p>
                <input type="text" id="token" placeholder="Enter Admin Token" style="padding:10px; margin-bottom:10px;">
                <button onclick="verify()" style="padding:10px 20px; background:blue; color:white; border:none; border-radius:5px;">Activate Now</button>
                
                <script>
                    function verify() {
                        const t = document.getElementById('token').value;
                        if(t === "PANKAJ2026") {
                            alert("Activation Successful!");
                            window.location.href = "dms_login://success";
                        } else {
                            alert("Invalid Token!");
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

// Server Start karna
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


