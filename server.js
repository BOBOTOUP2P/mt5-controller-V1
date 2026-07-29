const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// បង្កើត Object សម្រាប់រក្សាទុកស្ថានភាពគណនីផ្ញើមកពី MT5
let mt5Status = {
    balance: 0.00,
    equity: 0.00,
    positions: "No active trades",
    lastSeen: 0 // កត់ត្រាម៉ោងដែល MT5 បានផ្ញើសារមកចុងក្រោយ
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API សម្រាប់ទទួលការកំណត់ពី Web Dashboard
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved successfully");
});

// API សម្រាប់ឱ្យ MT5 មកទាញយកការកំណត់
app.get('/get-settings', (req, res) => {
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// ១. API ថ្មី៖ ទទួលទិន្នន័យសមតុល្យ និងការត្រេដផ្ញើមកពី MT5
app.post('/update-status', (req, res) => {
    mt5Status = {
        balance: req.body.balance,
        equity: req.body.equity,
        positions: req.body.positions,
        lastSeen: Date.now() // កត់ត្រាម៉ោងបច្ចុប្បន្ន
    };
    res.send("Status updated");
});

// ២. API ថ្មី៖ ផ្ញើព័ត៌មានគណនី និងស្ថានភាព VPS ទៅឱ្យទំព័រវេបសាយ HTML បង្ហាញ
app.get('/get-status', (req, res) => {
    const now = Date.now();
    // បើ MT5 មិនបានផ្ញើសារមកលើសពី ៦ វិនាទី បញ្ជាក់ថា VPS ឬ MT5 បានបិទ (លោតសញ្ញាក្រហម បរាជ័យ)
    const isAlive = (now - mt5Status.lastSeen) < 6000; 
    
    res.json({
        balance: mt5Status.balance,
        equity: mt5Status.equity,
        positions: mt5Status.positions,
        vpsActive: isAlive
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
