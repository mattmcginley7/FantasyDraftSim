const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
app.use(cors());


const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API route to get all players
app.get('/api/players', (req, res) => {
    fs.readFile(path.join(__dirname, 'players.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading players.json:', err);
            return res.status(500).json({ error: 'Error reading player data' });
        }
        res.json(JSON.parse(data));
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
