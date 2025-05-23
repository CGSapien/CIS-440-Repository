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
// serve static files from node_modules (so calendar JS and CSS can be accessed)
app.use('/node_modules', express.static('node_modules'));

// Routes to serve HTML files
app.get('/', (req, res) => {
   res.sendFile(__dirname + '/public/logon.html');
});

app.get('/dashboard', (req, res) => {
   res.sendFile(__dirname + '/public/dashboard.html');
});

// Helper function to create a MySQL connection
async function createConnection() {
   return await mysql.createConnection({
       host: process.env.DB_HOST,
       user: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       database: process.env.DB_NAME,
   });
}

// Authorization Middleware: Verify JWT Token and Check User in Database
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
           const [rows] = await connection.execute('SELECT email FROM user WHERE email = ?', [decoded.email]);
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

// Route to create account
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

// Route to log in
app.post('/api/login', async (req, res) => {
   const { email, password } = req.body;

   if (!email || !password) {
       return res.status(400).json({ message: 'Email and password are required.' });
   }

   try {
       const connection = await createConnection();
       const [rows] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);
       await connection.end();  // Close connection

       if (rows.length === 0) {
           return res.status(401).json({ message: 'Invalid email or password.' });
       }

       const user = rows[0];
       const isPasswordValid = await bcrypt.compare(password, user.password);
       if (!isPasswordValid) {
           return res.status(401).json({ message: 'Invalid email or password.' });
       }

       const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.status(200).json({ token });
   } catch (error) {
       console.error(error);
       res.status(500).json({ message: 'Error logging in.' });
   }
});


// Route to get user's goals
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

// Route to update goals
app.put('/api/updategoals', authenticateToken, async (req, res) => {
   try {
       console.log("📥 Received request at /api/updategoals");
       console.log("🔍 Request Body:", req.body);
       console.log("🔍 User Email:", req.user.email);

       const { tertiary1, tertiary2, Sub1, Sub2, main_goal } = req.body;
       const email = req.user.email;

       const connection = await createConnection();
       const [existingRows] = await connection.execute('SELECT * FROM goal WHERE email = ?', [email]);

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

//feature 2 
//get events for user
app.get('/api/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.email; // Assuming email is used as user_id

        const connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT event_id, calendar_id, title, start, end, event_type, notes, iscomplete FROM events WHERE user_id = ?',
            [userId]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No events found for this user.' });
        }

        // Separate tasks and events
        const events = rows
        .filter(event => event.event_type === 'allday')
        .map(event => {
            let checklist = [];
            try {
                checklist = event.notes ? JSON.parse(event.notes) : [];
            } catch (err) {
                console.warn("Failed to parse notes JSON for event_id:", event.event_id);
            }

            return {
                ...event,
                checklist
            };
        });
        const tasks = rows
            .filter(task => task.event_type === 'task')
            .map(task => ({ ...task, iscomplete: Boolean(task.iscomplete) })); // Ensure `iscomplete` is boolean

        res.status(200).json({ events, tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving events.', error: error.message });
    }
});

// UPDATE an Event 
app.put('/api/eventchanges', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { event_id } = req.body; // Only expect event_id in the request body

        if (!event_id) {
            return res.status(400).json({ message: 'Event ID is required.' });
        }
        const connection = await createConnection();

        // Retrieve current iscomplete value
        const [existingEvent] = await connection.execute(
            'SELECT iscomplete FROM events WHERE event_id = ? AND user_id = ?',
            [event_id, userId]
        );

        if (existingEvent.length === 0) {
            await connection.end();
            return res.status(403).json({ message: 'Unauthorized or event not found.' });
        }

        const currentStatus = existingEvent[0].iscomplete;
        const newStatus = !currentStatus; // Flip the boolean value

        // Update the iscomplete field
        await connection.execute(
            'UPDATE events SET iscomplete = ? WHERE event_id = ? AND user_id = ?',
            [newStatus, event_id, userId]
        );

        await connection.end();
        res.status(200).json({ message: `Task completion status updated to ${newStatus}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating task completion status.', error: error.message });
    }
});

app.put('/api/updatechecklist', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { event_id, checklist } = req.body;

        if (!event_id || !Array.isArray(checklist)) {
            console.log(event_id);
            console.log(checklist);
            return res.status(400).json({ message: 'Missing event_id or checklist.' });
        }

        const connection = await createConnection();

        const [existingEvent] = await connection.execute(
            'SELECT event_id FROM events WHERE event_id = ? AND user_id = ?',
            [event_id, userId]
        );

        if (existingEvent.length === 0) {
            await connection.end();
            return res.status(403).json({ message: 'Unauthorized or event not found.' });
        }

        // Serialize the checklist before saving it to the database
        const checklistString = JSON.stringify(checklist);

        // Update the event's notes with the serialized checklist
        await connection.execute(
            'UPDATE events SET notes = ? WHERE event_id = ? AND user_id = ?',
            [checklistString, event_id, userId]
        );

        await connection.end();
        res.status(200).json({ message: 'Checklist updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating checklist.', error: error.message });
    }
});



//create event
app.post('/api/newevents', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.email; // Get the authenticated user's email
        const { calendar_id, title, start, end, notes, event_type, iscomplete } = req.body;

        // Validate required fields
        if (!calendar_id || !title || !start || !end) {
            console.log(req.body);
            return res.status(400).json({ message: 'Missing required fields: calendar_id, title, start, end.' });
        }

        const connection = await createConnection();
        let result;

        if (calendar_id === "excersise") {
            // Insert task (has iscomplete)
            [result] = await connection.execute(
                `INSERT INTO events (user_id, calendar_id, title, start, end, notes, event_type, iscomplete) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, calendar_id, title, start, end, notes || null, event_type, iscomplete ]
            );
        } else if (calendar_id === "daily_journal" || calendar_id === "nutrition_plan") {
            [result] = await connection.execute(
                `INSERT INTO events (user_id, calendar_id, title, start, end, notes, event_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, calendar_id, title, start, end, notes || null, event_type]
            );
        } else {
            return res.status(400).json({ message: 'Invalid calendar_id. Must be "daily_journal", "exercise", or "nutrition_plan".' });
        }

        await connection.end();

        if (!result) {
            return res.status(500).json({ message: 'Error inserting event into the database.' });
        }

        res.status(201).json({ message: 'Event created successfully.', event_id: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating event.', error: error.message });
    }
});

//new post 

// DELETE an Event 
app.delete('/api/events/deleteEvent/:event_id', authenticateToken, async (req, res) => {
    let connection;
    try {
        const userId = req.user.email;
        const eventId = req.params.event_id; // Fixed: Correctly accessing event_id from route parameters

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID is required.' });
        }

        connection = await createConnection();

        // Check if the event exists and belongs to the user
        const [existingEvent] = await connection.execute(
            'SELECT * FROM events WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (existingEvent.length === 0) {
            await connection.end();
            console.log(eventId);
            console.log(userId);
            return res.status(403).json({ message: 'Unauthorized or event not found.' });
        }

        // Delete the event
        await connection.execute(
            'DELETE FROM events WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        res.status(200).json({ message: 'Event deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting event.', error: error.message });
    }
});

// add a mantra
app.post('/api/newmantra', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.email;
        const { mantra } = req.body;

        if (!mantra) {
            return res.status(400).json({ message: 'Missing required field: mantra.' });
        }

        const connection = await createConnection();

        const [result] = await connection.execute(
            `INSERT INTO user_mantras (user_id, mantra) VALUES (?, ?)`,
            [userId, mantra]
        );

        await connection.end();

        if (!result) {
            return res.status(500).json({ message: 'Error inserting mantra into the database.' });
        }

        res.status(201).json({ message: 'Mantra saved successfully.', mantra_id: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving mantra.', error: error.message });
    }
});

app.get('/api/mantras', authenticateToken, async (req, res) => {
    let connection;
    try {
        const userEmail = req.user.email;

        connection = await createConnection();
        const [rows] = await connection.execute(
            'SELECT id, mantra, created_at FROM user_mantras WHERE user_id = ? ORDER BY created_at DESC',
            [userEmail]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'No mantras found for this user.' });
        }

        res.status(200).json({ mantras: rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving mantras.', error: error.message });

    } finally {
        if (connection) await connection.end(); // Safely close connection
    }
});

// Start the server
app.listen(port, () => {
   console.log(`Server running at http://localhost:${port}`);
});
