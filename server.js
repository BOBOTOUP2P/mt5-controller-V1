const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let lastSeenTime = 0; // ពេលចុងក្រោយដែល MT5 ផ្ញើសារមក
let mt5Stats = {
    balance: 0.00,
    equity: 0.00,
    margin: 0.00,
    positions: [],
    logs: []
};

// ១. ផ្លូវបង្ហាញទំព័រ Dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ២. API សម្រាប់ទទួលបញ្ជារក្សាទុកការកំណត់ពីវេបសាយ
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved successfully");
});

// ៣. API ទ្វេដង (2-Way Sync): MT5 ផ្ញើទិន្នន័យមកផង និងទទួលយកការកំណត់ថ្មីទៅវិញផងក្នុងពេលតែមួយ
app.post('/sync', (req, res) => {
    lastSeenTime = Date.now(); // កត់ត្រាពេលវេលាតភ្ជាប់
    mt5Stats = req.body; // រក្សាទុកទិន្នន័យគណនីពី MT5
    
    // អានការកំណត់បច្ចុប្បន្នផ្ញើត្រឡប់ទៅឱ្យ MT5 វិញ
    try {
        const settings = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(settings);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// ៤. API សម្រាប់ឱ្យទំព័រវេបសាយទាញយកទិន្នន័យទៅបង្ហាញ (Real-time Stats)
app.get('/get-realtime-data', (req, res) => {
    let status = "Connecting"; // កំពុងតភ្ជាប់
    const now = Date.now();
    
    if (lastSeenTime === 0) {
        status = "Connecting";
    } else if (now - lastSeenTime < 6000) {
        status = "Active"; // ភ្ជាប់ជាប់ (តិចជាង ៦ វិនាទី)
    } else {
        status = "Failed"; // បរាជ័យ (លើសពី ៦ វិនាទី)
    }
    
    res.json({
        status: status,
        stats: mt5Stats
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
