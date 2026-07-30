const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យក្នុង Memory (In-Memory State)
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: [],  // លំដាប់កំពុងរត់
    history: [],    // លំដាប់បិទរួច
    journal: [],    // កំណត់ហេតុប្រព័ន្ធ
    lastPing: 0
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់រក្សាទុកការកំណត់ពី Dashboard
app.post('/save', (req, res) => {
    const { lot, tp, sl, active } = req.body;
    const csvData = `${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("Saved new parameters: " + csvData);
    res.send("Saved");
});

// ២. API សម្រាប់ឱ្យ MT5 ផ្ញើទិន្នន័យស្ថានភាពលម្អិតមក និងទទួលយកការកំណត់ត្រឡប់ទៅវិញ (POST Request)
app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal } = req.body;
    
    // រក្សាទុកទិន្នន័យដែលផ្ញើមកពី MT5
    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: positions ? JSON.parse(positions) : [],
        history: history ? JSON.parse(history) : [],
        journal: journal ? JSON.parse(journal) : [],
        lastPing: Date.now()
    };
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        // បើមិនទាន់មាន settings.txt ផ្ញើ default parameters ទៅមុន
        res.send("0.01,0.65,5.00,1");
    }
});

// ៣. API សម្រាប់ឱ្យ Dashboard ទាញយកទិន្នន័យទាំងអស់ទៅបង្ហាញលើ UI
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
