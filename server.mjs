import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let db;
async function initDatabase() {
    db = await open({
        filename: join(__dirname, 'digital_ai.db'),
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            api_key TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            model TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS api_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            request TEXT,
            response TEXT,
            status_code INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('✅ База данных SQLite инициализирована');
}

const NVIDIA_API_KEY = "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";
const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

function generateApiKey() {
    return 'nvapi-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
}

app.post('/api/register', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Имя и email обязательны' });
    }
    
    try {
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', email);
        
        if (existingUser) {
            return res.json({ 
                success: true, 
                message: 'Добро пожаловать снова!', 
                api_key: existingUser.api_key,
                name: existingUser.name
            });
        }
        
        const api_key = generateApiKey();
        await db.run('INSERT INTO users (name, email, api_key) VALUES (?, ?, ?)', [name, email, api_key]);
        
        res.json({ 
            success: true, 
            message: 'Регистрация успешна', 
            api_key: api_key,
            name: name
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

app.post('/api/save-message', async (req, res) => {
    const { user_email, role, content, model } = req.body;
    
    if (!user_email) {
        return res.json({ success: true });
    }
    
    try {
        await db.run(
            'INSERT INTO chat_history (user_email, role, content, model) VALUES (?, ?, ?, ?)',
            [user_email, role, content, model || 'google/gemma-3n-e4b-it']
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при сохранении сообщения' });
    }
});

app.get('/api/chat-history/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
        const history = await db.all(
            'SELECT role, content, created_at FROM chat_history WHERE user_email = ? ORDER BY created_at ASC LIMIT 50',
            email
        );
        res.json({ success: true, history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении истории' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, user_email, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Сообщение обязательно' });
    }
    
    if (user_email) {
        await db.run(
            'INSERT INTO chat_history (user_email, role, content) VALUES (?, ?, ?)',
            [user_email, 'user', message]
        );
    }
    
    let messagesForAPI = [
        { role: "system", content: "Ты Digital AI — полезный, дружелюбный и экспертный ассистент на базе NVIDIA AI. Отвечай кратко, информативно и по делу." }
    ];
    
    if (history && history.length > 0) {
        const recentHistory = history.slice(-10);
        messagesForAPI.push(...recentHistory);
    }
    
    messagesForAPI.push({ role: "user", content: message });
    
    const payload = {
        model: "google/gemma-3n-e4b-it",
        messages: messagesForAPI,
        max_tokens: 512,
        temperature: 0.20,
        top_p: 0.70,
        frequency_penalty: 0.00,
        presence_penalty: 0.00,
        stream: true
    };
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const response = await axios({
            method: 'post',
            url: NVIDIA_ENDPOINT,
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            data: payload,
            responseType: 'stream'
        });
        
        let fullResponse = '';
        
        response.data.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            const lines = chunkStr.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const jsonStr = line.substring(6);
                        const parsed = JSON.parse(jsonStr);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {}
                }
            }
        });
        
        response.data.on('end', async () => {
            if (user_email && fullResponse) {
                await db.run(
                    'INSERT INTO chat_history (user_email, role, content) VALUES (?, ?, ?)',
                    [user_email, 'assistant', fullResponse]
                );
            }
            
            await db.run(
                'INSERT INTO api_logs (user_email, request, response, status_code) VALUES (?, ?, ?, ?)',
                [user_email || 'anonymous', message, fullResponse.substring(0, 500), 200]
            );
            
            res.write('data: [DONE]\n\n');
            res.end();
        });
        
    } catch (error) {
        console.error('NVIDIA API Error:', error.message);
        
        await db.run(
            'INSERT INTO api_logs (user_email, request, response, status_code) VALUES (?, ?, ?, ?)',
            [user_email || 'anonymous', message, error.message, 500]
        );
        
        res.write(`data: ${JSON.stringify({ error: 'Ошибка API NVIDIA: ' + error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
        const totalMessages = await db.get('SELECT COUNT(*) as count FROM chat_history');
        const totalApiCalls = await db.get('SELECT COUNT(*) as count FROM api_logs');
        
        res.json({
            success: true,
            stats: {
                users: totalUsers.count,
                messages: totalMessages.count,
                api_calls: totalApiCalls.count
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

app.listen(PORT, async () => {
    await initDatabase();
    console.log(`\n🚀 Сервер запущен!`);
    console.log(`📍 Откройте в браузере: http://localhost:${PORT}`);
    console.log(`💬 Чат готов к работе!\n`);
});