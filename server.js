const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកទិន្នន័យក្នុង Memory
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: [],
    history: [],
    journal: [],
    lastPing: 0,
    serverName: "Exness-MT5Trial7",
    accountId: "433935345",
    password: "Id168169",
    mmtId: "MMT-000000000"
};

// មុខងារបង្កើតលេខចៃដន្យ ៩ ខ្ទង់សម្រាប់ MMT ID
function generateMMTId() {
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    return `MMT-${rand}`;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់រក្សាទុកការកំណត់ និងព័ត៌មាន Exness ពី Dashboard
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, serverName, accountId, password, mmtId } = req.body;
    
    // ប្រសិនបើមិនទាន់មាន MMT ID ទេ ត្រូវបង្កើតថ្មីមួយ
    const finalMmtId = mmtId && mmtId !== "MMT-000000000" ? mmtId : generateMMTId();
    
    // រៀបចំទិន្នន័យជាទម្រង់ CSV ដើម្បីផ្ញើទៅ MT5
    const csvData = `${lot},${tp},${sl},${active},${serverName},${accountId},${password},${finalMmtId}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("Saved parameters & Exness Account: " + csvData);
    
    res.json({ status: "success", mmtId: finalMmtId });
});

// ២. API សម្រាប់ទទួលព័ត៌មានពី MT5 និងផ្ញើការកំណត់ត្រឡប់ទៅវិញ
app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal } = req.body;
    
    let parsedPositions = [];
    let parsedHistory = [];
    let parsedJournal = [];

    try { if (positions) parsedPositions = JSON.parse(positions); } catch (e) {}
    try { if (history) parsedHistory = JSON.parse(history); } catch (e) {}
    try { if (journal) parsedJournal = JSON.parse(journal); } catch (e) {}
    
    // អានទិន្នន័យចុងក្រោយពី settings.txt មកបង្ហាញលើ UI
    let savedServer = "Exness-MT5Trial7";
    let savedAccount = "433935345";
    let savedPassword = "Id168169";
    let savedMmtId = "MMT-000000000";

    try {
        const fileContent = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        const parts = fileContent.split(',');
        if(parts.length >= 8) {
            savedServer = parts[4];
            savedAccount = parts[5];
            savedPassword = parts[6];
            savedMmtId = parts[7];
        }
    } catch (err) {}

    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: parsedPositions,
        history: parsedHistory,
        journal: parsedJournal,
        lastPing: Date.now(),
        serverName: savedServer,
        accountId: savedAccount,
        password: savedPassword,
        mmtId: savedMmtId
    };
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        // លំនាំដើមបើគ្មានឯកសារ
        const defaultMmt = generateMMTId();
        res.send(`0.01,0.65,5.00,1,Exness-MT5Trial7,433935345,Id168169,${defaultMmt}`);
    }
});

// ៣. API សម្រាប់ Dashboard ទាញយកទិន្នន័យទៅបង្ហាញ
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server running`));
