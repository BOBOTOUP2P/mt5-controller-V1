const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let dbConnected = false;

// ១. តភ្ជាប់ទៅកាន់ MongoDB Database
const MONGO_URI = "mongodb+srv://nna617014_db_user:HcihqVABHE4BLqSL@cluster0.iwa7tts.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("Connected to MongoDB Atlas");
    dbConnected = true;
})
.catch(err => {
    dbConnected = false;
});

// ២. រចនាសម្ព័ន្ធផ្ទុកទិន្នន័យ (លុបចោល Password ទាំងស្រុង)
const UserSchema = new mongoose.Schema({
    accId: { type: String, unique: true },
    server: String,
    lotSize: Number,
    sl_usd: Number,
    tp_usd: Number,
    active: Boolean,
    balance: { type: String, default: "0.00" },
    equity: { type: String, default: "0.00" },
    positions: { type: String, default: "គ្មានការជួញដូរសកម្មឡើយ" },
    log: { type: String, default: "EA ដំណើរការធម្មតា" },
    lastPing: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ៣. API សម្រាប់ទទួលបញ្ជាពីវិបសាយ (លុបចោល Password)
app.post('/save', async (req, res) => {
    const { accId, server, lot, tp, sl, active } = req.body;
    try {
        await User.findOneAndUpdate(
            { accId: accId },
            { accId, server, lotSize: lot, tp_usd: tp, sl_usd: sl, active: active === 1 },
            { upsert: true, new: true }
        );
        res.send("Saved");
    } catch (err) {
        res.status(500).send("Error");
    }
});

// ៤. API សម្រាប់ទទួលទិន្នន័យពី MT5 លើ VPS រួចផ្ញើការកំណត់ជួញដូរត្រឡប់ទៅវិញភ្លាមៗ
app.post('/update', async (req, res) => {
    const { accId, balance, equity, positions, log } = req.body;
    try {
        const updatedUser = await User.findOneAndUpdate(
            { accId: accId },
            { balance, equity, positions, log, lastPing: Date.now() },
            { new: true }
        );
        if (updatedUser) {
            const csvSettings = `${updatedUser.accId},${updatedUser.server},${updatedUser.lotSize},${updatedUser.tp_usd},${updatedUser.sl_usd},${updatedUser.active ? 1 : 0},500`;
            res.send(csvSettings);
        } else {
            res.send("NOT_FOUND");
        }
    } catch (err) {
        res.send("ERROR");
    }
});

// ៥. API សម្រាប់ទាញយកស្ថានភាពគណនី Exness ទៅបង្ហាញលើវិបសាយ Bybit
app.get('/api/status-account/:accId', async (req, res) => {
    try {
        const user = await User.findOne({ accId: req.params.accId });
        if (user) {
            res.json({
                success: true,
                balance: user.balance,
                equity: user.equity,
                positions: user.positions,
                log: user.log,
                lastPing: user.lastPing,
                serverTime: Date.now()
            });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.json({ success: false });
    }
});

// ៦. API សម្រាប់ទាញយកស្ថានភាពស្ពានតភ្ជាប់ទូទៅ (លែងប្រើ MetaApi នាំតែស្មុគស្មាញ)
app.get('/api/status-general', (req, res) => {
    res.json({
        db: dbConnected,
        api: true 
    });
});

app.listen(PORT, () => console.log(`Server is running`));
