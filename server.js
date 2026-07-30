const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកព័ត៌មានគណនីពិតៗរបស់ MT5 នៅក្នុង RAM របស់ Server (ល្បឿនលឿន គ្មាន Database)
let mt5Status = {
    accId: "414063265",
    balance: "0.00",
    equity: "0.00",
    positions: "គ្មានការជួញដូរសកម្មឡើយ",
    log: "ប្រព័ន្ធដំណើរការធម្មតា",
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ទទួលការកំណត់ Lot, TP, SL ពីវិបសាយ Bybit
app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `414063265,Exness-MT5Trial6,${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("បានរក្សាទុកការកំណត់ថ្មី៖ " + csvData);
    res.send("Saved");
});

// ២. API ពិសេស៖ MT5 ផ្ញើលុយ និងលំដាប់ត្រេដមក រួចយកការកំណត់ទៅវិញភ្លាមៗក្នុងពេលតែមួយ (GET)
app.get('/get-settings', (req, res) => {
    // ទទួលទិន្នន័យពី MT5 តាមរយៈ URL Query Parameters
    const { balance, equity, positions, log, accId } = req.query;
    
    mt5Status = {
        accId: accId || "414063265",
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: positions || "គ្មានការជួញដូរសកម្មឡើយ",
        log: log || "EA ដំណើរការធម្មតា",
        lastPing: Date.now()
    };

    // ផ្ញើការកំណត់ត្រឡប់ទៅឱ្យ MT5
    try {
        const settings = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(settings);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1");
    }
});

// ៣. API សម្រាប់ឱ្យវិបសាយ Bybit ទាញយកទិន្នន័យទៅបង្ហាញលើអេក្រង់
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true // Database បង្ហាញ ACTIVE ជានិច្ច
    });
});

app.listen(PORT, () => console.log(`Server is running`));
