const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let mt5State = {
    balance: 0,
    equity: 0,
    margin: 0,
    positions: [],
    last_ping: null,
    experts_log: "រង់ចាំការតភ្ជាប់...",
    journal_log: "រង់ចាំការតភ្ជាប់..."
};

// ១. ផ្លូវបង្ហាញទំព័រវេបសាយ
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ២. វេបសាយរក្សាទុកការកំណត់
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved");
});

// ៣. MT5 មកទាញយកការកំណត់
app.get('/get-settings', (req, res) => {
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// ៤. API សម្រាប់ឱ្យ MT5 ផ្ញើព័ត៌មានគណនីមកអាប់ដេតលើវិបសាយ
app.post('/update-state', (req, res) => {
    mt5State = req.body;
    mt5State.last_ping = new Date().toISOString();
    res.send("State Updated");
});

// ៥. វេបសាយទាញយកព័ត៌មានគណនី MT5 មកបង្ហាញ
app.get('/get-state', (req, res) => {
    res.json(mt5State);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
