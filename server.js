const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកស្ថានភាពទិន្នន័យពី MT5 របស់អតិថិជនម្នាក់ៗក្នុង Memory
let clientsStore = {};

function getClientState(accountId) {
    if (!clientsStore[accountId]) {
        clientsStore[accountId] = {
            balance: "0.00",
            equity: "0.00",
            positions: [],
            history: [],
            journal: [],
            lastPing: 0,
            serverName: "",
            accountId: accountId,
            password: ""
        };
    }
    return clientsStore[accountId];
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ចុះឈ្មោះ/រក្សាទុកគណនី Exness និងការកំណត់ពីវិបសាយ
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, serverName, accountId, password } = req.body;
    
    if (!accountId) {
        return res.status(400).json({ error: "Missing Account ID" });
    }

    const csvData = `${lot},${tp},${sl},${active},${serverName},${accountId},${password}`;
    
    // រក្សាទុកការកំណត់ចូលក្នុង File ទៅតាមលេខគណនី Exness នីមួយៗ
    fs.writeFileSync(__dirname + `/settings_${accountId}.txt`, csvData);
    console.log(`Saved parameters for Exness Account [${accountId}]`);
    
    res.json({ status: "success" });
});

// ២. API សម្រាប់ឱ្យ EA នៅលើ MT5 មកទាញយកការកំណត់ទៅតាមលេខគណនីដែលកំពុងរត់ផ្ទាល់
app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal, accountId } = req.body;
    
    if (!accountId) {
        return res.send("0.01,0.65,5.00,1,Exness-MT5Trial7,0,0");
    }

    let parsedPositions = [];
    let parsedHistory = [];
    let parsedJournal = [];

    try { if (positions) parsedPositions = JSON.parse(positions); } catch (e) {}
    try { if (history) parsedHistory = JSON.parse(history); } catch (e) {}
    try { if (journal) parsedJournal = JSON.parse(journal); } catch (e) {}
    
    // រក្សាទុកទិន្នន័យគណនីរបស់អតិថិជននេះចូលក្នុង Memory
    const client = getClientState(accountId);
    client.balance = balance || "0.00";
    client.equity = equity || "0.00";
    client.positions = parsedPositions;
    client.history = parsedHistory;
    client.journal = parsedJournal;
    client.lastPing = Date.now();

    try {
        const data = fs.readFileSync(__dirname + `/settings_${accountId}.txt`, 'utf8');
        res.send(data);
    } catch (err) {
        // បើមិនទាន់មានការកំណត់ក្នុង File ទេ ផ្ញើតម្លៃលំនាំដើមទៅមុន
        res.send(`0.01,0.65,5.00,1,Exness-MT5Trial7,${accountId},0`);
    }
});

// ៣. API សម្រាប់ឱ្យ Dashboard ទាញយកទិន្នន័យមកបង្ហាញតាមលេខគណនីនីមួយៗ
app.get('/api/status', (req, res) => {
    const accountId = req.query.accountId;
    if (!accountId) {
        return res.json({ error: "Require Account ID" });
    }

    const client = getClientState(accountId);
    
    try {
        const fileContent = fs.readFileSync(__dirname + `/settings_${accountId}.txt`, 'utf8');
        const parts = fileContent.split(',');
        if(parts.length >= 7) {
            client.serverName = parts[4];
            client.password = parts[6];
        }
    } catch (err) {}

    res.json({
        ...client,
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server is running`));
