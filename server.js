const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let telemetryData = { balance: 0.0, equity: 0.0, positions: 0, lastPing: 0 };

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ទទួលទិន្នន័យជួញដូរពី MT5 (Telemetry)
app.post('/update-telemetry', (req, res) => {
    const { balance, equity, positions } = req.body;
    telemetryData = {
        balance: parseFloat(balance).toFixed(2),
        equity: parseFloat(equity).toFixed(2),
        positions: parseInt(positions),
        lastPing: Date.now()
    };
    res.send("Telemetry updated");
});

// ២. API សម្រាប់ឱ្យវេបសាយមកយកទិន្នន័យទៅបង្ហាញលើអេក្រង់
app.get('/get-telemetry', (req, res) => {
    const isOnline = (Date.now() - telemetryData.lastPing < 8000); // បើបាត់ទាក់ទងលើស ៨ វិនាទី គឺដាច់ (Offline)
    res.json({
        balance: telemetryData.balance,
        equity: telemetryData.equity,
        positions: telemetryData.positions,
        status: isOnline ? "Active" : "Offline"
    });
});

// ៣. API សម្រាប់ទទួលការកំណត់ពី Dashboard
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved successfully");
});

// ៤. API សម្រាប់ឱ្យ MT5 មកទាញយកការកំណត់
app.get('/get-settings', (req, res) => {
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
