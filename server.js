require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

//////////////////////////////////////
//ROUTES TO SERVE HTML FILES - test
//////////////////////////////////////
// Default route to serve logon.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

// Route to serve dashboard.html
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});
//////////////////////////////////////
//END ROUTES TO SERVE HTML FILES
//////////////////////////////////////


/////////////////////////////////////////////////
//HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////
// Helper function to create a MySQL connection
async function createConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

// **Authorization Middleware: Verify JWT Token and Check User in Database**
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        try {
            const connection = await createConnection();

            // Query the database to verify that the email is associated with an active account
            const [rows] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [decoded.email]
            );

            await connection.end();  // Close connection

            if (rows.length === 0) {
                return res.status(403).json({ message: 'Account not found or deactivated.' });
            }

            req.user = decoded;  // Save the decoded email for use in the route
            next();  // Proceed to the next middleware or route handler
        } catch (dbError) {
            console.error(dbError);
            res.status(500).json({ message: 'Database error during authentication.' });
        }
    });
}
/////////////////////////////////////////////////
//END HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////


//////////////////////////////////////
//ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////
// Route: Create Account
app.post('/api/create-account', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password

        const [result] = await connection.execute(
            'INSERT INTO user (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        await connection.end();  // Close connection

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'An account with this email already exists.' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error creating account.' });
        }
    }
});

// Route: Logon
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        await connection.end();  // Close connection

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});

// Route: Get All Email Addresses
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        const [rows] = await connection.execute('SELECT email FROM user');

        await connection.end();  // Close connection

        const emailList = rows.map((row) => row.email);
        res.status(200).json({ emails: emailList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving email addresses.' });
    }
});

//Route: Get Users Goals
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email; // Extract email from the authenticated token

        const connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT tertiary1, tertiary2, Sub1, Sub2, main_goal FROM goal WHERE email = ?',
            [userEmail]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Goals not found for this user.' });
        }

        res.status(200).json({ goals: rows[0] }); // Return the user's goal data
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving goals.' });
    }
});

// add or updates goals
app.put('/api/updategoals', authenticateToken, async (req, res) => {
    try {
        console.log("📥 Received request at /api/updategoals");
        console.log("🔍 Request Body:", req.body);
        console.log("🔍 User Email:", req.user.email);

        const { tertiary1, tertiary2, Sub1, Sub2, main_goal } = req.body;
        const email = req.user.email;

        const connection = await createConnection();

        const [existingRows] = await connection.execute(
            'SELECT * FROM goal WHERE email = ?',
            [email]
        );

        if (existingRows.length > 0) {
            console.log("📌 Updating existing goals for:", email);

            await connection.execute(
                `UPDATE goal SET 
                    tertiary1 = ?, 
                    tertiary2 = ?, 
                    Sub1 = ?, 
                    Sub2 = ?, 
                    main_goal = ?
                 WHERE email = ?`,
                [
                    tertiary1 !== undefined ? tertiary1 : existingRows[0].tertiary1,
                    tertiary2 !== undefined ? tertiary2 : existingRows[0].tertiary2,
                    Sub1 !== undefined ? Sub1 : existingRows[0].Sub1,
                    Sub2 !== undefined ? Sub2 : existingRows[0].Sub2,
                    main_goal !== undefined ? main_goal : existingRows[0].main_goal,
                    email
                ]
            );
            res.status(200).json({ message: 'Goals updated successfully.' });
        } else {
            console.log("📌 No existing goals found, inserting new record...");

            await connection.execute(
                `INSERT INTO goal (email, tertiary1, tertiary2, Sub1, Sub2, main_goal) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [email, tertiary1 || null, tertiary2 || null, Sub1 || null, Sub2 || null, main_goal || null]
            );
            res.status(201).json({ message: 'Goals added successfully.' });
        }

        await connection.end();
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: 'Error updating goals.', error: error.message });
    }
});



//////////////////////////////////////
//END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});