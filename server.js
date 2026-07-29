const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យស្ថានភាពគណនីពី MT5
let mt5Status = {
    lastSeen: 0,
    balance: 0.00,
    equity: 0.00,
    positions: 0,
    profit: 0.00
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API សម្រាប់ទទួលបញ្ជាពីវេបសាយ
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved successfully");
});

app.get('/get-settings', (req, res) => {
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// API ថ្មី៖ ទទួលទិន្នន័យគណនីផ្ទាល់ពី MT5 VPS
app.post('/send-status', (req, res) => {
    const { balance, equity, positions, profit } = req.body;
    mt5Status = {
        lastSeen: Date.now(),
        balance: parseFloat(balance) || 0,
        equity: parseFloat(equity) || 0,
        positions: parseInt(positions) || 0,
        profit: parseFloat(profit) || 0
    };
    res.send("Status updated");
});

// API ថ្មី៖ ផ្ញើទិន្នន័យគណនីទៅឱ្យទំព័រវេបសាយបង្ហាញ
app.get('/get-status', (req, res) => {
    const isConnected = (Date.now() - mt5Status.lastSeen) < 8000; // ដាច់លើសពី ៨ វិនាទីចាត់ទុកថា Disconnected
    res.json({ ...mt5Status, isConnected });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
