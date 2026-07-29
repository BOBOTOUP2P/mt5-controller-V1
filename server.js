const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យបច្ចុប្បន្នភាពពី MT5 ក្នុង Memory
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: "គ្មានការជួញដូរសកម្មឡើយ",
    log: "កំពុងចាប់ផ្តើមប្រព័ន្ធ...",
    lastPing: 0
};

// ទំព័រដើម Dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API សម្រាប់ទទួលបញ្ជាពីវិបសាយ ( Lot, TP, SL )
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved");
});

// API ពីរប៉ះគ្នា (POST)៖ MT5 ផ្ញើស្ថានភាពគណនីមក រួច Server ផ្ញើការកំណត់ជួញដូរត្រឡប់ទៅវិញភ្លាមៗ
app.post('/update', (req, res) => {
    const { balance, equity, positions, log } = req.body;
    
    // បច្ចុប្បន្នភាពទិន្នន័យពី MT5
    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: positions || "គ្មានការជួញដូរសកម្មឡើយ",
        log: log || "EA កំពុងដំណើរការធម្មតា",
        lastPing: Date.now()
    };

    // ផ្ញើការកំណត់ជួញដូរចុងក្រោយត្រឡប់ទៅឱ្យ MT5
    try {
        const settings = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(settings);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// API សម្រាប់ទំព័រវិបសាយទាញយកទិន្នន័យ MT5 ទៅបង្ហាញ
app.get('/get-status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now()
    });
});

app.listen(PORT, () => console.log(`Server is running`));
