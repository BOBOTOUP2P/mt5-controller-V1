const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// ១. API សម្រាប់រក្សាទុកការកំណត់ពីវិបសាយ
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, serverName, accountId, password } = req.body;
    
    if (!accountId) {
        return res.status(400).json({ error: "Missing Account ID" });
    }

    const csvData = `${lot},${tp},${sl},${active},${serverName},${accountId},${password}`;
    fs.writeFileSync(__dirname + `/settings_${accountId}.txt`, csvData);
    console.log(`Saved settings for [${accountId}]`);
    
    res.json({ status: "success" });
});

// ២. API សម្រាប់ឱ្យ MT5 ផ្ញើទិន្នន័យ JSON សុទ្ធ និងទាញការកំណត់
app.post('/get-settings', (req, res) => {
    // ទទួលយកទិន្នន័យ JSON ផ្ទាល់ពី MT5 WebRequest
    const { balance, equity, positions, history, journal, accountId } = req.body;
    
    if (!accountId) {
        return res.send("0.01,0.65,5.00,1,Exness-MT5Trial7,0,0");
    }

    const client = getClientState(accountId);
    client.balance = balance || "0.00";
    client.equity = equity || "0.00";
    client.positions = Array.isArray(positions) ? positions : [];
    client.history = Array.isArray(history) ? history : [];
    client.journal = Array.isArray(journal) ? journal : [];
    client.lastPing = Date.now();

    try {
        const data = fs.readFileSync(__dirname + `/settings_${accountId}.txt`, 'utf8');
        res.send(data);
    } catch (err) {
        res.send(`0.01,0.65,5.00,1,Exness-MT5Trial7,${accountId},0`);
    }
});

// ៣. API សម្រាប់ឱ្យវិបសាយទាញយកស្ថានភាព
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
