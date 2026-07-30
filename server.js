const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យសមតុល្យលុយពិតពី MT5 នៅក្នុងមេម៉ូរី Server (RAM) - ឥតគិតថ្លៃ និងសាមញ្ញបំផុត
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ទទួលបញ្ជាការកំណត់ពីវិបសាយ Bybit
app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `414063265,Exness-MT5Trial6,${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("បានរក្សាទុកការកំណត់ថ្មី៖ " + csvData);
    res.send("Saved");
});

// ២. API សម្រាប់ទទួលទិន្នន័យលុយពិតពី MT5 (POST JSON) និងផ្ញើការកំណត់ទៅត្រេដវិញភ្លាមៗ
app.post('/update', (req, res) => {
    const { balance, equity } = req.body;
    
    // បច្ចុប្បន្នភាពសមតុល្យលុយក្នុងមេម៉ូរី RAM
    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        lastPing: Date.now()
    };

    try {
        const settings = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(settings);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1");
    }
});

// ៣. API សម្រាប់ឱ្យវិបសាយទាញយកសមតុល្យលុយពិតទៅបង្ហាញ Real-Time
app.get('/get-status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now()
    });
});

app.listen(PORT, () => console.log(`Server is running`));
