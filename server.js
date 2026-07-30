const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: [],
    history: [],
    journal: [],
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("Saved parameters: " + csvData);
    res.send("Saved");
});

app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal } = req.body;
    
    // ប្រើប្រាស់ try-catch ដើម្បីការពារការគាំង Server ប្រសិនបើការបញ្ជូនទិន្នន័យមានការរំខាន
    let parsedPositions = [];
    let parsedHistory = [];
    let parsedJournal = [];

    try {
        if (positions) parsedPositions = JSON.parse(positions);
    } catch (e) {
        console.log("Error parsing positions:", e);
    }

    try {
        if (history) parsedHistory = JSON.parse(history);
    } catch (e) {
        console.log("Error parsing history:", e);
    }

    try {
        if (journal) parsedJournal = JSON.parse(journal);
    } catch (e) {
        console.log("Error parsing journal:", e);
    }
    
    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: parsedPositions,
        history: parsedHistory,
        journal: parsedJournal,
        lastPing: Date.now()
    };
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("0.01,0.65,5.00,1");
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server running`));
