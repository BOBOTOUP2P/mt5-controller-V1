const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = '7295193744:AAGNc-XF990pHZV0nEccNT_zw62s2ZHIAYc';
const CHAT_ID = '1713583492';
const RENDER_URL = 'https://mt5-controller-v1.onrender.com';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: [],
    history: [],
    journal: [],
    lastPing: 0
};

// ដំឡើង Webhook ទៅកាន់តេឡេក្រាមដោយប្រើប្រាស់ Built-in Fetch របស់ Node.js
if (typeof fetch !== 'undefined') {
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${RENDER_URL}/telegram-webhook`)
        .then(res => res.json())
        .then(json => console.log("Telegram Webhook configured:", json))
        .catch(err => console.log("Webhook configuration error:", err));
} else {
    console.log("Native fetch is not supported on this Node.js version.");
}

// ជំនួយការអាន/សរសេរទិន្នន័យប្រតិបត្តិការ
function getTransactions() {
    try {
        if (fs.existsSync(__dirname + '/transactions.json')) {
            return JSON.parse(fs.readFileSync(__dirname + '/transactions.json', 'utf8'));
        }
    } catch (e) {
        console.log("Error reading transactions.json:", e);
    }
    return [];
}

function saveTransactions(txs) {
    try {
        fs.writeFileSync(__dirname + '/transactions.json', JSON.stringify(txs, null, 2));
    } catch (e) {
        console.log("Error writing transactions.json:", e);
    }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API ទាញយកបញ្ជីប្រតិបត្តិការដាក់/ដកប្រាក់
app.get('/api/transactions', (req, res) => {
    res.json(getTransactions());
});

// API បង្កើតប្រតិបត្តិការថ្មី (ដាក់/ដកប្រាក់)
app.post('/api/transaction', async (req, res) => {
    const { type, amount, uid, account } = req.body;
    const txs = getTransactions();

    // ពិនិត្យមើលថាតើមានប្រតិបត្តិការដែលកំពុងរង់ចាំ (Pending) ដែរឬទេ
    const hasPending = txs.some(t => t.status === 'Pending');
    if (hasPending) {
        return res.status(400).send("You already have an active pending transaction.");
    }

    const newTx = {
        id: Date.now().toString(),
        type, 
        amount,
        uid,
        account,
        status: 'Pending',
        time: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('km-KH')
    };

    txs.unshift(newTx);
    saveTransactions(txs);

    // រៀបចំសារផ្ញើទៅតេឡេក្រាមជាមួយប៊ូតុងបញ្ជាក់
    const messageText = `🔔 ${type} Request 🔔\n\n🔑 Login ID: 414063265\n💵 Amount: $${amount}\n🆔 UID BOBOTOU.io: ${uid}\n👤 Account BOBOTOU: ${account}\n\nStatus: Pending`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "Done ✅", callback_data: `done_${newTx.id}` },
                { text: "Rejection ❌", callback_data: `reject_${newTx.id}` }
            ]
        ]
    };

    try {
        if (typeof fetch !== 'undefined') {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: messageText,
                    reply_markup: keyboard
                })
            });
        }
    } catch (e) {
        console.log("Telegram Send Message Error:", e);
    }

    res.json({ success: true, tx: newTx });
});

// Telegram Webhook ទទួលការបញ្ជាក់ពី Admin
app.post('/telegram-webhook', async (req, res) => {
    const update = req.body;
    if (update && update.callback_query) {
        const query = update.callback_query;
        const data = query.data; 
        const parts = data.split('_');
        const action = parts[0]; 
        const txId = parts[1];

        const txs = getTransactions();
        const tx = txs.find(t => t.id === txId);

        if (tx && tx.status === 'Pending') {
            tx.status = action === 'done' ? 'Success' : 'Refusal';
            saveTransactions(txs);

            // កែសម្រួលសារចាស់នៅក្នុងតេឡេក្រាមដើម្បីបង្ហាញស្ថានភាពចុងក្រោយ
            const updatedText = `🔔 ${tx.type} Request Updated 🔔\n\n🔑 Login ID: 414063265\n💵 Amount: $${tx.amount}\n🆔 UID BOBOTOU.io: ${tx.uid}\n👤 Account BOBOTOU: ${tx.account}\n\nStatus: ${tx.status === 'Success' ? 'Success ✅' : 'Refusal ❌'}`;

            try {
                if (typeof fetch !== 'undefined') {
                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            text: updatedText,
                            reply_markup: { inline_keyboard: [] } 
                        })
                    });
                }
            } catch (e) {
                console.log("Telegram Edit Message Error:", e);
            }
        }

        try {
            if (typeof fetch !== 'undefined') {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: query.id,
                        text: `ការបញ្ជាក់ជោគជ័យ៖ ${tx ? tx.status : "Unknown"}`
                    })
                });
            }
        } catch (e) {
            console.log("Telegram Answer Callback Error:", e);
        }
    }
    res.sendStatus(200);
});

// API រក្សាទុកការកំណត់ទូទៅ
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, limit24h, lowLot } = req.body;
    const csvData = `${lot},${tp},${sl},${active},${limit24h},${lowLot}`;
    try {
        fs.writeFileSync(__dirname + '/settings.txt', csvData);
        res.send("Saved");
    } catch (e) {
        res.status(500).send("Error saving settings");
    }
});

// API សម្រាប់ភ្ជាប់ជាមួយ MT5 VPS
app.post('/get-settings', (req, res) => {
    const { balance, equity, positions, history, journal } = req.body;
    
    let parsedPositions = [];
    let parsedHistory = [];
    let parsedJournal = [];

    try { if (positions) parsedPositions = JSON.parse(positions); } catch (e) {}
    try { if (history) parsedHistory = JSON.parse(history); } catch (e) {}
    try { if (journal) parsedJournal = JSON.parse(journal); } catch (e) {}
    
    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: parsedPositions,
        history: parsedHistory,
        journal: parsedJournal,
        lastPing: Date.now()
    };
    
    try {
        const data = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        res.send(data);
    } catch (err) {
        res.send("0.01,0.65,5.00,1,0.50,0.30");
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
