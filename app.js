const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Establishing the database connection
const db = new sqlite3.Database('./Azura.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Connection failure: " + err.message);
        throw err; // Halts the application on failure to connect to the database
    } else {
        console.log('Successfully connected to the Azura SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS Vehicles (
            VehicleID INTEGER PRIMARY KEY AUTOINCREMENT,
            Make TEXT,
            Model TEXT,
            KM INTEGER,
            Color TEXT,
            Location TEXT,
            Value REAL
        )`, (err) => {
            if (err) {
                console.error("Error checking/creating table: " + err.message);
            } else {
                console.log("Vehicle table ready for use.");
            }
        });
    }
});

// Configuring middleware for parsing HTTP request bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Setting up EJS as the template engine
app.set('view engine', 'ejs');

// Define routes
// Home page route
app.get('/', (req, res) => {
    res.render('index', { message: null });
});

// Route to handle vehicle data submission
app.post('/add-vehicle', (req, res) => {
    const { make, model, km, color, location, value } = req.body;
    const query = `INSERT INTO Vehicles (Make, Model, KM, Color, Location, Value) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [make, model, km, color, location, value], function(err) {
        if (err) {
            console.error("Error during vehicle registration: " + err.message);
            res.render('index', { message: "Failed to capture vehicle: " + err.message });
        } else {
            res.render('index', { message: "Vehicle registered successfully" });
        }
    });
});

// Route to display all vehicles
app.get('/vehicles', (req, res) => {
    db.all('SELECT * FROM Vehicles', [], (err, rows) => {
        if (err) {
            console.error("Error retrieving vehicles: " + err.message);
            res.status(500).send("Database read error: " + err.message);
            return;
        }
        res.render('vehicles', { vehicles: rows, value: null });
    });
});

// Route to fetch vehicle value by ID
app.post('/vehicle-value', (req, res) => {
    const vehicleID = req.body.vehicleID;
    db.get('SELECT Value FROM Vehicles WHERE VehicleID = ?', [vehicleID], (err, row) => {
        if (err) {
            console.error("Error fetching vehicle value: " + err.message);
            res.status(500).send("Failed to retrieve vehicle value: " + err.message);
            return;
        }
        db.all('SELECT * FROM Vehicles', [], (err, rows) => {
            if (err) {
                console.error("Error reading all vehicles: " + err.message);
                res.status(500).send("Error reading vehicles: " + err.message);
                return;
            }
            res.render('vehicles', { vehicles: rows, value: row ? row.Value : "Vehicle ID not found" });
        });
    });
});

// Start the server and log access URL
app.listen(PORT, () => {
    console.log(`Server is active on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the server`);
});

// Ensure database connection is closed on server termination
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error("Failed to close database connection: " + err.message);
        }
        console.log('Database connection has been closed due to server shutdown.');
        process.exit(0);
    });
});
