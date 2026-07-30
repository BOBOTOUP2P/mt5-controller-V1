const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let lastPingTime = 0; // រក្សាទុកពេលវេលាតភ្ជាប់ចុងក្រោយរបស់ MT5

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់ទទួលបញ្ជាការកំណត់ពីវិបសាយ Bybit
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("បានរក្សាទុកការកំណត់ថ្មី៖ " + csvData);
    res.send("Saved");
});

// ២. API សម្រាប់ឱ្យ MT5 លើ VPS មកទាញយកការកំណត់ (និងឆ្កឹះ Ping ឱ្យវិបសាយដឹងក្នុងពេលតែមួយ)
app.get('/get-settings', (req, res) => {
    lastPingTime = Date.now(); // កត់ត្រាពេលវេលាដែល MT5 មកឆ្កឹះ
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        // បើគ្មានឯកសារកំណត់ទេ ផ្ញើការកំណត់លំនាំដើមនេះទៅមុន
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1");
    }
});

// ៣. API សម្រាប់ឱ្យវិបសាយទាញយកស្ថានភាពស្ពានតភ្ជាប់
app.get('/api/status', (req, res) => {
    res.json({
        lastPing: lastPingTime,
        serverTime: Date.now()
    });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
