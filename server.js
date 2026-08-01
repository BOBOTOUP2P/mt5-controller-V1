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

// API ទទួលការកំណត់ពីទំព័រ Dashboard
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, limit24h, lowLot } = req.body;
    // រក្សាទុកតម្លៃទាំង ៦ ទៅកាន់ Settings File
    const csvData = `${lot},${tp},${sl},${active},${limit24h},${lowLot}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("Updated CSV Settings: " + csvData);
    res.send("Saved");
});

// API សម្រាប់ភ្ជាប់ជាមួយ MT5 VPS
app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal } = req.body;
    
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
        console.log("Error parsing journal logs:", e);
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
        // បើគ្មានឯកសារទេ ផ្ញើ default parameters ទាំង ៦ ទៅកាន់ MT5
        res.send("0.01,0.65,5.00,1,0.50,0.30");
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

app.listen(PORT, () => console.log(`Server is running`));
