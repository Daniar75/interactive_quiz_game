// Игровые переменные
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const questionDisplay = document.getElementById('questionDisplay');
const finalScore = document.getElementById('finalScore');

// Настройки игры
let score = 0;
let gameRunning = false;
let lives = 3;

let timeLeft = 15;
const timerDisplay = document.createElement('div');
timerDisplay.id = 'timerDisplay';
document.body.appendChild(timerDisplay);

// Размеры canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Игровые объекты
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 8,
    color: '#3498db',
    bullets: [],
    lastShot: 0,
    shootDelay: 300
};

let enemies = [];
let currentQuestion = {};
let questions = [
    {
        question: "Какой язык программирования использует ключевое слово 'function' для объявления функций?",
        correct: "JavaScript",
        wrong: ["Python", "Java", "C++"]
    },
    {
        question: "Какой оператор используется для проверки равенства по значению и типу в JavaScript?",
        correct: "===",
        wrong: ["==", "=", "!=="]
    },
    {
        question: "Какой метод массива в JavaScript используется для добавления элемента в конец?",
        correct: "push()",
        wrong: ["pop()", "shift()", "unshift()"]
    },
    {
        question: "Какой тег HTML используется для вставки JavaScript кода?",
        correct: "<script>",
        wrong: ["<js>", "<javascript>", "<code>"]
    },
    {
        question: "Какой CSS-селектор выбирает элемент по его идентификатору?",
        correct: "#id",
        wrong: [".class", "tag", "*"]
    }
];

// Создаём резервную копию вопросов
let questionsBackup = [...questions];

function updateTimer() {
    timerDisplay.textContent = `Время: ${timeLeft} сек`;
    if (timeLeft <= 0) {
        gameOver();
    } else {
        setTimeout(() => {
            if (gameRunning) {
                timeLeft--;
                updateTimer();
            }
        }, 1000);
    }
}


// Функции игры
function drawPlayer() {
    ctx.fillStyle = player.color;
    // Рисуем корабль игрока
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height/2);
    ctx.lineTo(player.x - player.width/2, player.y + player.height/2);
    ctx.lineTo(player.x + player.width/2, player.y + player.height/2);
    ctx.closePath();
    ctx.fill();
    
    // Рисуем пламя
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(player.x - player.width/4, player.y + player.height/2);
    ctx.lineTo(player.x, player.y + player.height/2 + 10);
    ctx.lineTo(player.x + player.width/4, player.y + player.height/2);
    ctx.closePath();
    ctx.fill();
}

function drawBullets() {
    ctx.fillStyle = '#FFD700';
    player.bullets.forEach((bullet, index) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        bullet.y -= 10;
        
        // Удаляем пули за пределами экрана
        if (bullet.y < 0) {
            player.bullets.splice(index, 1);
        }
    });
}

function drawEnemies() {
    enemies.forEach((enemy, index) => {
        ctx.fillStyle = enemy.isCorrect ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);
        
        // Текст ответа
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.text, enemy.x, enemy.y + 4);
        
        // Движение врагов
        enemy.y += enemy.speed;
        
        // Удаляем врагов за пределами экрана
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            if (enemy.isCorrect) {
                loseLife();
            }
        }
    });
}

function spawnEnemies() {
    if (Math.random() < 0.02 && enemies.length < 5) {
        const isCorrect = Math.random() < 0.25;
        const text = isCorrect ? currentQuestion.correct : 
            currentQuestion.wrong[Math.floor(Math.random() * currentQuestion.wrong.length)];
        
        enemies.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: 0,
            width: 100,
            height: 30,
            speed: 1 + Math.random() * 2,
            text: text,
            isCorrect: isCorrect
        });
    }
}

function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x > enemy.x - enemy.width/2 &&
                bullet.x < enemy.x + enemy.width/2 &&
                bullet.y > enemy.y - enemy.height/2 &&
                bullet.y < enemy.y + enemy.height/2
            ) {
                // Удаляем пулю и врага
                player.bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                
                if (enemy.isCorrect) {
                    score += 100;
                    scoreDisplay.textContent = `Очки: ${score}`;
                    nextQuestion();
                } else {
                    loseLife();
                }
            }
        });
    });
}

function nextQuestion() {
    if (questions.length === 0) {
        // Если вопросы закончились, перемешиваем их снова
        questions = [...questionsBackup];
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    questions.splice(randomIndex, 1);
    
    questionDisplay.textContent = currentQuestion.question;
}

function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameRunning = false;
    finalScore.textContent = `Ваш счёт: ${score}`;
    gameOverScreen.style.display = 'flex';

    const name = prompt("Введите ваше имя:");

    if (name) {
        fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, score: score })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Счёт сохранён!", data);
        })
        .catch(err => console.error("Ошибка сохранения счёта:", err));
    }
}


function resetGame() {
    timeLeft = 15;
updateTimer();
    score = 0;
    lives = 3;
    player.bullets = [];
    enemies = [];
    scoreDisplay.textContent = `Очки: ${score}`;
    questionsBackup = [...questions];
    nextQuestion();
}

function showHighScores() {
    startScreen.style.display = 'none';
    document.getElementById('highScoresScreen').style.display = 'block';

    fetch('/scores')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('highScoresList');
            list.innerHTML = '';

            data.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `${entry.name} — ${entry.score} очков`;
                list.appendChild(li);
            });
        });
}

function backToMenu() {
    document.getElementById('highScoresScreen').style.display = 'none';
    startScreen.style.display = 'flex';
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Очистка экрана
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем звёзды
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = (Math.random() * canvas.height + Date.now()/100) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
    
    // Игровая логика
    drawPlayer();
    drawBullets();
    spawnEnemies();
    drawEnemies();
    checkCollisions();
    
    requestAnimationFrame(gameLoop);
}

// Обработчики событий
window.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
});
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        player.x = e.touches[0].clientX;
    }
});

window.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;

    const now = Date.now();
    if (now - player.lastShot > player.shootDelay) {
        player.bullets.push({
            x: player.x,
            y: player.y - player.height/2
        });
        player.lastShot = now;
    }
});


window.addEventListener('click', (e) => {
    if (!gameRunning) return;
    
    const now = Date.now();
    if (now - player.lastShot > player.shootDelay) {
        player.bullets.push({
            x: player.x,
            y: player.y - player.height/2
        });
        player.lastShot = now;
    }
});

startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameRunning = true;
    resetGame();
    gameLoop();
});

restartButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    resetGame();
    gameLoop();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 50;
});
