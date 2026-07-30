const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យពី MT5 ក្នុងមេម៉ូរីបណ្តោះអាសន្ន
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: "គ្មានការជួញដូរសកម្មឡើយ",
    log: "ប្រព័ន្ធដំណើរការធម្មតា",
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API សម្រាប់ទទួលការកំណត់ជួញដូរពីវិបសាយ Bybit
app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("បានរក្សាទុកការកំណត់ថ្មី៖ " + csvData);
    res.send("Saved");
});

// API សម្រាប់ឱ្យ MT5 លើ VPS មកទាញយកការកំណត់ (និងបញ្ជូនលុយ លំដាប់ត្រេដ និង Logs មកបង្ហាញជាមួយគ្នា)
app.get('/get-settings', (req, res) => {
    const { balance, equity, positions, log } = req.query;
    
    if(balance && equity) {
        mt5Status = {
            balance: balance,
            equity: equity,
            positions: positions || "គ្មានការជួញដូរសកម្មឡើយ",
            log: log || "EA ដំណើរការធម្មតា",
            lastPing: Date.now()
        };
    }
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("0.01,0.65,5.00,1");
    }
});

// API សម្រាប់ឱ្យវិបសាយ Bybit ទាញយកទិន្នន័យរួមទៅបង្ហាញ
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,  
        api: true  
    });
});

app.listen(PORT, () => console.log(`Server is running`));
