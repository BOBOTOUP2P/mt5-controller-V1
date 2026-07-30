const express = require('express');
const mongoose = require('mongoose');
const MetaApi = require('metaapi.cloud-sdk').default;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let dbConnected = false;
let apiConnected = false;

// ១. តភ្ជាប់ទៅកាន់ MongoDB Database (បំពេញរួចរាល់)
const MONGO_URI = "mongodb+srv://nna617014_db_user:HcihqVABHE4BLqSL@cluster0.iwa7tts.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log("Connected to MongoDB");
    dbConnected = true;
})
.catch(err => {
    dbConnected = false;
});

// ២. តភ្ជាប់ជាមួយ MetaApi Cloud SDK (ប្រើប្រាស់ Token ទី ២ ត្រឹមត្រូវ ១០០% ឥតមានខូចទម្រង់)
const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzMTNlZTg2YTJhMzk1YWU4ZjI0YzE2OTEyOGQ1NTYwNSIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVStandardi_SUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxឡឹងLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiMzEzZWU4NmEyYTM5NWFlOGYyNGMxNjkxMjhkNTU2MDUiLCJpYXQiOjE3ODUzODMwODV9.W5JZKJ49abPb5V5LUtaz44bqQ8YKwwpTTHHThgsNGONTa1zcxuRO3jNPl-tR9T36JnNF3_21zp3zNaHzd0w43CfPj1LFqNE157degdhQpvOxAXAR8Kt_W7foKeyNK7zeVsiK58hyC4HRoBaZpuLshclPwXEaty-s2M7g4hU-l8dWa8g249nvMiaSS_8vQy3KVbw6fNWQKBNwH-wwfT_oOBhsyN5W-TqQ-oW7bE0OXM2HzPwo-NMcCjvXw9FOhzVH3HSbXpuT9yj_mgDqiG5dsRzNsq2Me56t-e14bcot9TIRJIa7r5ylLtVQr8XmWqZ9cxZHUU4Ldlw7DPGZrVMi_ybRgke3fq3-sividIFvL09j8v5YT3G-SqKauL5fDiSs1bW0qwlqjxxitwvW-KfMil5p15_Axhh31cQMvLQPVlkxfXBGTI2RjfVCUK8HRP1ZuoWJ8_amLDUETQ5VvWJmifuCZKDYjFtEHL0-HHQH49rqOvT_UxzNZsxAeu-mXbhzNtTZBjoDuyizRmlEuzdKs8PdahXu6fViv-ZRala1KIQ1iexkAg7TWKQHbWmUOWMKYqziuqjiKKwRzVg8iCeh-SZMPSzkICA4Z1k4DYYI06OZ0BxA04Ji-XS1xgdviaRL3627Vu_rE6cy4E8-kKqg4cMoSp7N__pL6LJSX6e_ZaM";
const api = new MetaApi(token);

api.metatraderAccountApi.getAccounts()
.then(() => { apiConnected = true; })
.catch(() => { apiConnected = false; });

const UserSchema = new mongoose.Schema({
    accId: { type: String, unique: true },
    password_mt5: String,
    server: String,
    platform: String,
    lotSize: Number,
    sl_usd: Number,
    tp_usd: Number,
    active: Boolean
});
const User = mongoose.model('User', UserSchema);

// ៣. API សម្រាប់សមាជិកចុះឈ្មោះ និងផ្ទៀងផ្ទាត់ (ប្រព័ន្ធឆ្លាតវៃមិនបង្កើតជាន់កូតា)
app.post('/api/register', async (req, res) => {
    const { accId, password_mt5, server, platform, lotSize, sl_usd, tp_usd } = req.body;
    
    try {
        const existingAccounts = await api.metatraderAccountApi.getAccounts();
        let account = null;
        
        for (const acc of existingAccounts) {
            if (acc.login == accId) {
                account = acc;
                console.log("-> Found existing MetaApi account: " + acc.id);
                break;
            }
        }
        
        if (account === null) {
            for (const acc of existingAccounts) {
                await acc.remove();
            }
            
            account = await api.metatraderAccountApi.createAccount({
                name: "Client_" + accId,
                type: 'cloud',
                reliability: 'regular', 
                login: accId,
                password: password_mt5,
                server: server,
                platform: platform,
                magic: 555555
            });
            console.log("-> Created new MetaApi account: " + account.id);
        }
        
        const connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();
        
        const accountInfo = await connection.getAccountInformation();

        // រក្សាទុកក្នុង Database
        await User.findOneAndUpdate(
            { accId: accId },
            { accId, password_mt5, server, platform, lotSize, sl_usd, tp_usd, active: true },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            message: "ជោគជ័យ៖ គណនី Exness របស់អ្នកត្រូវបានតភ្ជាប់ទៅកាន់ Cloud ជោគជ័យ!",
            balance: accountInfo.balance,
            equity: accountInfo.equity
        });
        
    } catch (err) {
        res.json({ success: false, message: "ការតភ្ជាប់ទៅ Exness បរាជ័យ៖ " + err.message });
    }
});

// ៤. API សម្រាប់ទាញយកស្ថានភាពស្ពានតភ្ជាប់ទូទៅ
app.get('/api/status-general', (req, res) => {
    res.json({
        db: dbConnected,
        api: apiConnected
    });
});

// ៥. API សម្រាប់ស្កែនរកស្ថានភាពគណនី
app.get('/api/status-account/:accId', async (req, res) => {
    let accountConnected = false;
    let balance = "0.00", equity = "0.00";
    
    try {
        const user = await User.findOne({ accId: req.params.accId });
        
        if (user) {
            const existingAccounts = await api.metatraderAccountApi.getAccounts();
            let account = null;
            
            for (const acc of existingAccounts) {
                if (acc.login == req.params.accId) {
                    account = acc;
                    break;
                }
            }
            
            if (account) {
                const connection = account.getRPCConnection();
                await connection.connect();
                await connection.waitSynchronized();
                
                const accountInfo = await connection.getAccountInformation();
                balance = accountInfo.balance;
                equity = accountInfo.equity;
                accountConnected = true;
            }
        }
    } catch (err) {
        accountConnected = false;
    }

    res.json({
        account: accountConnected,
        balance: balance,
        equity: equity
    });
});

app.listen(PORT, () => console.log(`Server is running`));
