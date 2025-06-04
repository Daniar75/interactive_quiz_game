// server.js
const express = require('express');
const path = require('path');
const db = require('./db'); // ВАЖНО: подключаем db.js

const app = express();
console.log('Express создан');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// API — Сохранить счёт
app.post('/save-score', (req, res) => {
    const { name, score } = req.body;

    if (name && typeof score === 'number') {
        const stmt = db.prepare('INSERT INTO scores (name, score) VALUES (?, ?)');
        stmt.run(name, score);
        stmt.finalize();
        res.sendStatus(200);
    } else {
        res.status(400).send('Invalid data');
    }
});


// API — Получить топ-10 результатов
app.get('/api/scores', (req, res) => {
    db.all('SELECT * FROM scores ORDER BY score DESC LIMIT 10', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при получении данных' });
        }
        res.json(rows);
    });
});

console.log('Настройка завершена');

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
