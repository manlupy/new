const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

// 设置Canvas大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 倒计时目标时间
const targetDate = new Date('2025-01-29T00:00:00').getTime();

// 标志变量，跟踪倒计时音效是否已经播放过
let countdownSoundPlayed = false;

// 更新倒计时
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (distance < 0) {
        clearInterval(countdownInterval);
        document.getElementById('countdown-main').innerHTML = "新年快乐！";
        document.getElementById('countdown-seconds').innerHTML = "";
        playCelebrationVideo();
    } else if (distance <= 11000) { // 最后10秒
        document.getElementById('countdown-main').innerHTML = "";
        document.getElementById('countdown-seconds').innerHTML = `${seconds}秒`;
        if (!countdownSoundPlayed) {
            playCountdownSound();
            countdownSoundPlayed = true; // 设置标志变量为true，表示音效已经播放过
        }
    } else {
        document.getElementById('countdown-main').innerHTML = 
            `${days}天 ${hours}小时 ${minutes}分钟`;
        document.getElementById('countdown-seconds').innerHTML = `${seconds}秒`;
    }
}

// 每秒更新一次倒计时
const countdownInterval = setInterval(updateCountdown, 1000);

// 播放庆祝视频
function playCelebrationVideo() {
    const video = document.getElementById('celebrationVideo');
    video.style.display = 'block';
    video.play();
}

// 播放爆炸音效
function playExplosionSound() {
    const sound = document.getElementById('explosionSound');
    sound.currentTime = 0; // 重置音效播放时间
    sound.play();
}

// 播放倒计时音效
function playCountdownSound() {
    const sound = document.getElementById('countdownSound');
    sound.currentTime = 0; // 重置音效播放时间
    sound.play();
}

// 烟花粒子类
class Particle {
    constructor(x, y, color, size, velocityX, velocityY, lifetime, isTrail = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.lifetime = lifetime;
        this.alpha = 1; // 粒子透明度
        this.isTrail = isTrail; // 是否是拖尾粒子
    }

    // 更新粒子状态
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.lifetime--;
        if (this.isTrail) {
            this.alpha -= 0.02; // 拖尾粒子逐渐变透明
        } else {
            this.alpha -= 0.01; // 爆炸粒子透明度变化
        }
        this.size *= 0.98; // 粒子逐渐变小
    }

    // 绘制粒子
    draw() {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(${this.color}, ${this.alpha})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient; // 使用渐变效果
        ctx.fill();
    }
}

// 烟花类
class Firework {
    constructor(x, y, targetY, color) {
        this.x = x;
        this.y = y;
        this.targetY = targetY; // 目标高度
        this.color = color; // 烟花颜色
        this.exploded = false;
        this.trailParticles = []; // 拖尾粒子
        this.explosionParticles = []; // 爆炸粒子
    }

    // 创建拖尾粒子
    createTrailParticles() {
        const trailParticle = new Particle(
            this.x,
            this.y,
            this.color, // 使用烟花颜色
            Math.random() * 3 + 1,
            Math.random() * 1 - 0.5, // 随机的微小偏移
            Math.random() * 1 - 0.5,
            20,
            true
        );
        this.trailParticles.push(trailParticle);
    }

    // 创建爆炸粒子
    createExplosionParticles() {
        const numParticles = 50; // 增加粒子数量
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 3; // 随机速度
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed + 1; // 添加向下的偏移量
            const size = Math.random() * 3 + 2;
            const lifetime = Math.random() * 150 + 100;

            this.explosionParticles.push(new Particle(this.x, this.y, this.color, size, velocityX, velocityY, lifetime));
        }
        playExplosionSound(); // 播放爆炸音效
    }

    // 更新烟花状态
    update() {
        if (!this.exploded) {
            // 升空阶段
            this.y -= 4; // 向上移动
            this.createTrailParticles();
            if (this.y <= this.targetY) {
                this.exploded = true;
                this.createExplosionParticles();
            }
        }

        // 更新拖尾粒子
        this.trailParticles.forEach((p, index) => {
            p.update();
            if (p.alpha <= 0 || p.lifetime <= 0) {
                this.trailParticles.splice(index, 1); // 移除消失的粒子
            }
        });

        // 更新爆炸粒子
        this.explosionParticles.forEach((p, index) => {
            p.update();
            if (p.alpha <= 0 || p.lifetime <= 0) {
                this.explosionParticles.splice(index, 1); // 移除消失的粒子
            }
        });
    }

    // 绘制烟花
    draw() {
        if (!this.exploded) {
            // 绘制升空的烟花核心
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, 1)`; // 使用烟花颜色
            ctx.fill();
        }

        // 绘制拖尾粒子
        this.trailParticles.forEach(p => p.draw());

        // 绘制爆炸粒子
        this.explosionParticles.forEach(p => p.draw());
    }
}

// 星星类
class Star {
    constructor(x, y, size, brightness) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.brightness = brightness;
        this.twinkleFactor = Math.random() * 0.05 + 0.01; // 闪烁因子
    }

    // 更新星星状态
    update() {
        this.brightness += this.twinkleFactor;
        if (this.brightness >= 1 || this.brightness <= 0) {
            this.twinkleFactor = -this.twinkleFactor; // 反转闪烁方向
        }
    }

    // 绘制星星
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fill();
    }
}

// 创建星星
function createStars() {
    const stars = [];
    for (let i = 0; i < 200; i++) { // 增加星星的数量
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        const brightness = Math.random();
        stars.push(new Star(x, y, size, brightness));
    }
    return stars;
}

const stars = createStars();

// 存储烟花实例
let fireworks = [];

// 创建一个烟花实例
function createFirework(x, y) {
    const targetY = Math.random() * canvas.height / 2 + 100; // 随机目标高度
    const colors = [
        '255, 69, 0',    // 橙红
        '255, 215, 0',   // 金黄
        '173, 216, 230', // 浅蓝
        '144, 238, 144', // 浅绿
        '255, 20, 147',  // 粉红
        '75, 0, 130',    // 靛蓝
        '238, 130, 238', // 紫罗兰
        '0, 255, 255',   // 青色
        '255, 105, 180', // 热粉色
        '255, 165, 0',   // 橙色
        '0, 128, 0',     // 绿色
        '0, 0, 255',     // 蓝色
        '128, 0, 128',   // 紫色
        '255, 0, 0',     // 红色
        '255, 255, 255'  // 白色
    ];
    const color = colors[Math.floor(Math.random() * colors.length)]; // 随机颜色
    fireworks.push(new Firework(x, y, targetY, color));
}

// 动画循环
function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 半透明黑色背景，用于拖影效果
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新并绘制星星
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    fireworks.forEach((firework, index) => {
        firework.update();
        firework.draw();
        if (firework.exploded && firework.explosionParticles.length === 0) {
            fireworks.splice(index, 1); // 移除完成的烟花
        }
    });

    // 定期生成烟花
    if (Math.random() < 0.05) {
        createFirework(Math.random() * canvas.width, canvas.height);
    }

    requestAnimationFrame(animate); // 保证动画流畅
}

// 添加点击事件监听器
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    createFirework(x, y);
});

animate(); // 启动动画
