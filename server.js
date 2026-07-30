const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ១. តភ្ជាប់ទៅកាន់ MongoDB Database
const MONGO_URI = "mongodb+srv://nna617014_db_user:HcihqVABHE4BLqSL@cluster0.iwa7tts.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Database connection failed", err));

// ២. បង្កើតរចនាសម្ព័ន្ធផ្ទុកទិន្នន័យសមាជិក (Database Schema)
const UserSchema = new mongoose.Schema({
    accId: { type: String, unique: true },
    password_mt5: String,
    server: String,
    platform: String,
    lotSize: Number,
    sl_usd: Number,
    tp_usd: Number,
    active: Boolean,
    balance: { type: String, default: "0.00" },
    equity: { type: String, default: "0.00" },
    positions: { type: String, default: "គ្មានការជួញដូរសកម្មឡើយ" },
    log: { type: String, default: "កំពុងរង់ចាំការភ្ជាប់ពី MT5..." },
    lastPing: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ៣. API សម្រាប់សមាជិកចុះឈ្មោះ និងកំណត់ប៉ារ៉ាម៉ែត្រជួញដូរលើវិបសាយ
app.post('/api/register', async (req, res) => {
    const { accId, password_mt5, server, platform, lotSize, sl_usd, tp_usd } = req.body;
    try {
        await User.findOneAndUpdate(
            { accId: accId },
            { accId, password_mt5, server, platform, lotSize, sl_usd, tp_usd, active: true },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "រក្សាទុកការកំណត់ និងបើកស្ពានតភ្ជាប់ទៅ VPS រួចរាល់!" });
    } catch (err) {
        res.json({ success: false, message: "កំហុសបច្ចេកទេស៖ " + err.message });
    }
});

// ៤. API សម្រាប់កម្មវិធី MT5 លើ VPS ផ្ញើស្ថានភាពគណនីមក និងទាញយកការកំណត់ទៅត្រេដវិញភ្លាមៗ
app.post('/update', async (req, res) => {
    const { accId, balance, equity, positions, log } = req.body;
    try {
        const updatedUser = await User.findOneAndUpdate(
            { accId: accId },
            { balance, equity, positions, log, lastPing: Date.now() },
            { new: true }
        );
        if (updatedUser) {
            // ផ្ញើការកំណត់ជួញដូរចុងក្រោយត្រឡប់ទៅឱ្យ MT5 វិញជាអក្សរក្បៀស (CSV)
            const csvSettings = `${updatedUser.accId},${updatedUser.server},${updatedUser.lotSize},${updatedUser.tp_usd},${updatedUser.sl_usd},${updatedUser.active ? 1 : 0},500`;
            res.send(csvSettings);
        } else {
            res.send("NOT_FOUND");
        }
    } catch (err) {
        res.send("ERROR");
    }
});

// ៥. API សម្រាប់ទាញយកស្ថានភាពគណនីទៅបង្ហាញលើវិបសាយ Bybit
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

app.listen(PORT, () => console.log(`Server is running`));
