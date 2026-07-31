const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// រក្សាទុកស្ថានភាពទូទៅ
let mt5Status = {
    balance: "0.00",
    equity: "0.00",
    positions: [],
    history: [],
    journal: [],
    lastPing: 0
};

// ប្រព័ន្ធកត់ត្រាប្រចាំថ្ងៃសម្រាប់ប្រតិទិន (រក្សាទុកក្នុង Memory ដើម្បីកុំឱ្យបាត់ពេល Refresh)
let dailyPerformance = {}; // ទម្រង់៖ {"2026-07-31": { profit: 2.20, type: 'blue' }}

// ព័ត៌មានគ្រប់គ្រងប្រព័ន្ធ ២៤ ម៉ោង
let limitHitTime = null;
let accumulatedProfit24h = 0.00;
let totalSL24h = 0.00;
let totalTP24h = 0.00;
let lastResetTimestamp = Date.now();

// មុខងារកំណត់ឡើងវិញរៀងរាល់ ២៤ ម៉ោងសម្រាប់ប្រអប់សរុបប្រចាំថ្ងៃ
function checkAndReset24hStats() {
    const now = Date.now();
    if (now - lastResetTimestamp >= 24 * 60 * 60 * 1000) {
        totalSL24h = 0.00;
        totalTP24h = 0.00;
        accumulatedProfit24h = 0.00;
        lastResetTimestamp = now;
        console.log("24-hour accumulation counters reset to $0.00");
    }
}

// មុខងារពិនិត្យការដំណើរការឡើងវិញស្វ័យប្រវត្តិ (Auto-Resume)
function checkAutoResume() {
    if (limitHitTime) {
        const now = Date.now();
        if (now - limitHitTime >= 24 * 60 * 60 * 1000) {
            limitHitTime = null;
            accumulatedProfit24h = 0.00;
            
            // អានឯកសារកំណត់ចាស់ រួចកែប្រែ Active State ទៅជា 1 (Run) ឡើងវិញ
            try {
                const raw = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
                let parts = raw.split(',');
                if (parts.length >= 6) {
                    parts[3] = "1"; // Set Active to 1
                    fs.writeFileSync(__dirname + '/settings.txt', parts.join(','));
                    console.log("EA Auto-Resumed successfully after 24 hours.");
                }
            } catch (e) {
                console.log("Auto-resume settings read error:", e);
            }
        }
    }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ១. API សម្រាប់រក្សាទុកការកំណត់ជួញដូរពី Dashboard
app.post('/save', (req, res) => {
    const { lot, tp, sl, active, limit24h, lowLot } = req.body;
    // ទម្រង់រក្សាទុក៖ lot,tp,sl,active,limit24h,lowLot
    const csvData = `${lot},${tp},${sl},${active},${limit24h},${lowLot}`;
    
    fs.writeFileSync(__dirname + '/settings.txt', csvData);
    console.log("Saved parameters on server: " + csvData);
    res.send("Saved");
});

// ២. API សម្រាប់ឱ្យ MT5 ទាញយកការកំណត់ និងបញ្ជូនសមតុល្យត្រឡប់មកវិញ
app.post('/get-settings', (req, res) => {
    checkAndReset24hStats();
    checkAutoResume();

    const { balance, equity, positions, history, journal } = req.body;
    
    let parsedPositions = [];
    let parsedHistory = [];
    let parsedJournal = [];

    try { if (positions) parsedPositions = JSON.parse(positions); } catch (e) {}
    try { if (history) parsedHistory = JSON.parse(history); } catch (e) {}
    try { if (journal) parsedJournal = JSON.parse(journal); } catch (e) {}

    // គណនាផលចំណេញ/ខាតសរុបប្រចាំថ្ងៃ និងកំណត់ចំណុចប្រតិទិន
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0]; // ទម្រង់៖ YYYY-MM-DD

    let tempProfit = 0.00;
    parsedHistory.forEach(deal => {
        const profitVal = parseFloat(deal.profit || 0);
        tempProfit += profitVal;
        if (profitVal > 0) {
            totalTP24h += profitVal;
        } else if (profitVal < 0) {
            totalSL24h += Math.abs(profitVal);
        }
    });

    accumulatedProfit24h = tempProfit;

    // កត់ត្រាចូលប្រតិទិនប្រចាំថ្ងៃ
    if (accumulatedProfit24h !== 0) {
        dailyPerformance[todayKey] = {
            profit: accumulatedProfit24h,
            type: accumulatedProfit24h >= 0 ? 'blue' : 'red'
        };
    }

    // ពិនិត្យលក្ខខណ្ឌ LIMIT (TP)/24h
    let currentSettings = "0.01,0.65,5.00,1,0.50,0.30";
    try {
        currentSettings = fs.readFileSync(__dirname + '/settings.txt', 'utf8');
        const parts = currentSettings.split(',');
        if (parts.length >= 6) {
            const limitVal = parseFloat(parts[4].replace('$', ''));
            const activeVal = parseInt(parts[3]);

            if (activeVal === 1 && accumulatedProfit24h >= limitVal) {
                parts[3] = "0"; // ផ្អាកការជួញដូរ (Stop EA)
                limitHitTime = Date.now();
                currentSettings = parts.join(',');
                fs.writeFileSync(__dirname + '/settings.txt', currentSettings);
                console.log(`Limit reached ($${accumulatedProfit24h}). EA Stopped for 24 hours.`);
            }
        }
    } catch (err) {
        // ប្រសិនបើគ្មានឯកសារកំណត់ទេ វានឹងបង្កើតឯកសារស្វ័យប្រវត្ត
        fs.writeFileSync(__dirname + '/settings.txt', currentSettings);
    }

    mt5Status = {
        balance: balance || "0.00",
        equity: equity || "0.00",
        positions: parsedPositions,
        history: parsedHistory,
        journal: parsedJournal,
        lastPing: Date.now()
    };
    
    res.send(currentSettings);
});

// ៣. API សម្រាប់បញ្ជូនទិន្នន័យទៅកាន់ Interface Dashboard
app.get('/api/status', (req, res) => {
    res.json({
        ...mt5Status,
        totalSL24h: totalSL24h.toFixed(2),
        totalTP24h: totalTP24h.toFixed(2),
        dailyPerformance: dailyPerformance,
        eaActive: limitHitTime ? 0 : undefined, // ប្រាប់ UI ប្រសិនបើជាប់ Limit
        serverTime: Date.now(),
        db: true,
        api: true
    });
});

app.listen(PORT, () => console.log(`Server is running`));
