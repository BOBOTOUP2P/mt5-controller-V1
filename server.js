const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យពី MT5 ក្នុងមេម៉ូរីបណ្តោះអាសន្ន (In-Memory - គ្មាន Database នាំរញ៉េរញ៉ៃ)
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ទទួលការកំណត់ជួញដូរពីវិបសាយ Bybit (Lot, TP, SL)
app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("បានរក្សាទុកការកំណត់ថ្មី៖ " + csvData);
    res.send("Saved");
});

// ២. API សម្រាប់ឱ្យ MT5 លើ VPS មកទាញយកការកំណត់ (និងបញ្ជូនលុយមកបង្ហាញក្នុងពេលតែមួយ)
app.get('/get-settings', (req, res) => {
    // ទាញយកតម្លៃលុយ Balance និង Equity ដែល MT5 ផ្ញើភ្ជាប់មកជាមួយលីង
    const balance = req.query.balance;
    const equity = req.query.equity;
    
    if(balance && equity) {
        mt5Status = {
            balance: balance,
            equity: equity,
            lastPing: Date.now()
        };
    }
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        // បើគ្មានឯកសារកំណត់ទេ ផ្ញើការកំណត់លំនាំដើមទៅមុន
        res.send("0.01,0.65,5.00,1");
    }
});

// ៣. API សម្រាប់ឱ្យវិបសាយ Bybit ទាញយកស្ថានភាព និងចំនួនលុយពិតជាក់ស្តែងទៅបង្ហាញ
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,  // Database សកម្មជានិច្ច
        api: true  // ស្ពានតភ្ជាប់សកម្មជានិច្ច
    });
});

app.listen(PORT, () => console.log(`Server is running`));
