const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.text()); // អានអត្ថបទ CSV ពី MT5
app.use(express.static('public'));

let lastPollTime = Date.now(); // ពេលវេលាទាក់ទងចុងក្រោយពី MT5

// ១. ផ្លូវសម្រាប់បង្ហាញទំព័រវិបសាយ
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ២. វិបសាយបញ្ជូនការកំណត់ទៅ MT5
app.post('/save', (req, res) => {
    const { accId, server, lot, tp, sl, active, spread } = req.body;
    const csvData = `${accId},${server},${lot},${tp},${sl},${active},${spread}`;
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    res.send("Saved successfully");
});

// ៣. MT5 ទាញយកការកំណត់ពី Cloud
app.get('/get-settings', (req, res) => {
    lastPollTime = Date.now(); // អាប់ដេតពេលវេលាពេល MT5 មកសួរនាំ
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("414063265,Exness-MT5Trial6,0.01,0.65,5.00,1,500");
    }
});

// ៤. MT5 ផ្ញើព័ត៌មានគណនីពិតៗមកកាន់ Cloud
app.post('/update-status', (req, res) => {
    const csvStatus = req.body; 
    fs.writeFileSync(__dirname + '/status.txt', csvStatus);
    res.send("Status updated");
});

// ៥. វិបសាយទាញយកទិន្នន័យគណនី និងស្ថានភាពតភ្ជាប់
app.get('/get-status', (req, res) => {
    const now = Date.now();
    const isOnline = (now - lastPollTime) < 10000; // បើលើសពី ១០ វិនាទី គឺ Offline
    
    let statusData = "0.0,0.0,0.0,0,0.0"; // តម្លៃលំនាំដើម
    try {
        statusData = fs.readFileSync(__dirname + '/status.txt', 'utf8');
    } catch (err) {}

    res.json({
        isOnline: isOnline,
        data: statusData // ផ្ញើអត្ថបទ CSV ទៅឱ្យវិបសាយ
    });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
