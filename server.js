const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Variables សម្រាប់រក្សាទុកទិន្នន័យបណ្តោះអាសន្ន
let mt5Settings = "414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500";
let mt5Data = {
    balance: 0.0,
    equity: 0.0,
    positions: [],
    logs: [],
    last_ping: 0
};

// ១. ទំព័រដើម Dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ២. វេបសាយផ្ញើការកំណត់ទៅ MT5
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    mt5Settings = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    res.send("Saved");
});

// ៣. MT5 មកទាញយកការកំណត់ពីវេបសាយ
app.get('/get-settings', (req, res) => {
    res.send(mt5Settings);
});

// ៤. API សម្រាប់ទទួលទិន្នន័យផ្ទាល់ពី MT5 (Balance, Positions, Logs)
app.post('/update-terminal', (req, res) => {
    mt5Data = req.body;
    mt5Data.last_ping = Date.now(); // កត់ត្រាម៉ោងដែល MT5 បានផ្ញើសារមកចុងក្រោយ
    res.send("Updated");
});

// ៥. API សម្រាប់ឱ្យវេបសាយ Dashboard មកទាញយកទិន្នន័យជួញដូរយកទៅបង្ហាញ
app.get('/get-terminal-data', (req, res) => {
    // គណនាស្ថានភាពស្ពានតភ្ជាប់ (បើតភ្ជាប់លើសពី 8 វិនាទីគ្មានការឆ្លើយតប គឺដាច់ការតភ្ជាប់)
    const isOnline = (Date.now() - mt5Data.last_ping < 8000) ? "online" : "offline";
    res.json({ ...mt5Data, status: isOnline });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
