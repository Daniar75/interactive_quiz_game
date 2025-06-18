const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;


const db = new sqlite3.Database('scores.db', (err) => {
  
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('База данных подключена.');
    // Создание таблицы, если она не существует
    db.run(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы:', err.message);
      } else {
        console.log('Таблица scores готова.');
      }
    });
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для получения топ-10 рекордов
app.get('/scores', (req, res) => {
  db.all('SELECT username, score FROM scores ORDER BY score DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error('Ошибка при получении данных:', err.message);
      res.status(500).json({ error: 'Ошибка чтения из базы данных' });
    } else {
      res.json(rows);
    }
  });
});

// Маршрут для добавления нового результата
app.post('/scores', (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  db.run(
    'INSERT INTO scores (username, score) VALUES (?, ?)',
    [username, score],
    function (err) {
      if (err) {
        console.error('Ошибка при добавлении результата:', err.message);
        return res.status(500).json({ error: 'Ошибка записи в базу данных' });
      }
      res.json({ message: 'Результат сохранен', id: this.lastID });
    }
  );
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

