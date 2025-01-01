class DivingGame {
    constructor() {
        this.diver = document.querySelector('.diver');
        this.gameArea = document.querySelector('.game-area');
        this.timerDisplay = document.querySelector('.timer');
        this.depthDisplay = document.querySelector('.depth');
        this.startBtn = document.getElementById('start-btn');
        this.diveBtn = document.getElementById('dive-btn');
        this.floatBtn = document.getElementById('float-btn');
        this.resultDisplay = document.getElementById('result');
        this.creatures = document.querySelectorAll('.creature');

        this.gameStarted = false;
        this.isDiving = true;
        this.currentDepth = 0;
        this.maxDepth = 0;
        this.elapsedTime = 0;
        this.startTime = null;
        this.creatureTimers = [];
        this.viewportHeight = window.innerHeight - 120;
        this.centerOffset = this.viewportHeight * 2/3; // 改为2/3位置

        this.initializeGame();
        this.initializeCreatures();
        
        window.addEventListener('resize', () => {
            this.viewportHeight = window.innerHeight - 120;
            this.centerOffset = this.viewportHeight * 2/3;
            this.updatePosition();
        });
    }

    initializeGame() {
        this.startBtn.addEventListener('click', () => this.toggleGame());
        this.diveBtn.addEventListener('click', () => this.setDirection(true));
        this.floatBtn.addEventListener('click', () => this.setDirection(false));
        this.resetPosition();
    }

    initializeCreatures() {
        this.creatures.forEach(creature => {
            this.startCreatureMovement(creature);
        });
    }

    startCreatureMovement(creature) {
        let goingRight = true;
        const speed = 0.5 + Math.random() * 1; // 每次移动0.5-1.5像素
        let currentPosition = 50; // 开始位置在中间

        // 清除之前的定时器
        if (this.creatureTimers[creature.dataset.depth]) {
            clearInterval(this.creatureTimers[creature.dataset.depth]);
        }

        // 创建新的定时器
        this.creatureTimers[creature.dataset.depth] = setInterval(() => {
            if (goingRight) {
                currentPosition += speed;
                if (currentPosition >= 80) { // 到达右边界
                    goingRight = false;
                    creature.querySelector('img').style.transform = 'scaleX(-1)';
                }
            } else {
                currentPosition -= speed;
                if (currentPosition <= 20) { // 到达左边界
                    goingRight = true;
                    creature.querySelector('img').style.transform = 'scaleX(1)';
                }
            }
            creature.style.left = `${currentPosition}%`;
        }, 50); // 每50ms更新一次位置，使移动更平滑
    }

    startGame() {
        this.gameStarted = true;
        this.isDiving = true;
        this.currentDepth = 0;
        this.maxDepth = 0;
        this.startTime = Date.now();
        
        this.startBtn.textContent = '憋不住了';
        this.diveBtn.disabled = false;
        this.floatBtn.disabled = false;
        this.resultDisplay.textContent = '';
        
        this.startTimers();
    }

    endGame(success = false) {
        this.gameStarted = false;
        
        // 清除所有生物的移动定时器
        Object.values(this.creatureTimers).forEach(timer => clearInterval(timer));
        this.creatureTimers = [];
        
        this.startBtn.textContent = '开始憋气';
        this.diveBtn.disabled = true;
        this.floatBtn.disabled = true;

        if (success) {
            this.resultDisplay.textContent = `挑战成功！最大下潜深度：${this.maxDepth.toFixed(2)}米`;
        } else if (this.currentDepth > 0) {
            this.resultDisplay.textContent = `挑战失败！请确保回到水面再结束游戏`;
        } else {
            this.resultDisplay.textContent = `挑战成功！最大下潜深度：${this.maxDepth.toFixed(2)}米`;
        }

        this.resetPosition();
        this.initializeCreatures(); // 重新初始化生物移动
    }

    startTimers() {
        // 使用requestAnimationFrame来保持平滑的动画
        let lastTime = Date.now();
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
            lastTime = currentTime;

            if (this.gameStarted) {
                // 更新计时器显示
                this.elapsedTime = (currentTime - this.startTime) / 1000;
                this.updateTimer();

                // 更新深度
                if (this.isDiving) {
                    this.currentDepth += deltaTime; // 每秒1米
                    this.maxDepth = Math.max(this.maxDepth, this.currentDepth);
                } else {
                    this.currentDepth = Math.max(0, this.currentDepth - deltaTime);
                }
                
                // 更新位置和背景
                this.updatePosition();
                requestAnimationFrame(animate);
            }
        };

        // 启动动画循环
        animate();
    }

    updateTimer() {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        const centiseconds = Math.floor((this.elapsedTime * 100) % 100);
        this.timerDisplay.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    updateBackground() {
        const maxDepth = 60;
        const intensity = Math.max(0, 1 - (this.currentDepth / maxDepth));
        const blue = Math.floor(153 + (intensity * 102));
        const darkBlue = Math.floor(51 + (intensity * 102));
        this.gameArea.style.background = 
            `linear-gradient(180deg, rgb(0, ${blue}, 255) 0%, rgb(0, ${darkBlue}, 102) 100%)`;
    }

    updatePosition() {
        this.depthDisplay.textContent = `${this.currentDepth.toFixed(2)}米`;
        
        const pixelsPerMeter = 50; // 每米对应的像素数
        const totalDepth = this.currentDepth * pixelsPerMeter;
        const gameAreaHeight = this.gameArea.clientHeight;
        const scrollTop = this.gameArea.scrollTop;
        
        // 保持潜水员在视窗的2/3位置
        const targetViewportPosition = gameAreaHeight * 2/3;
        
        // 计算潜水员的实际位置（相对于整个内容区域）
        const absolutePosition = scrollTop + targetViewportPosition;
        
        // 如果深度小于目标视口位置，让潜水员自然下潜
        if (totalDepth < targetViewportPosition) {
            this.diver.style.top = `${totalDepth}px`;
            this.gameArea.scrollTop = 0;
        } else {
            // 否则保持潜水员在视口2/3处，并调整滚动位置
            this.diver.style.top = `${absolutePosition}px`;
            this.gameArea.scrollTop = totalDepth - targetViewportPosition;
        }

        // 更新生物位置
        this.creatures.forEach(creature => {
            const depth = parseFloat(creature.dataset.depth);
            creature.style.top = `${depth * pixelsPerMeter}px`;
        });

        // 更新背景颜色
        this.updateBackground();

        // 检查是否回到水面
        if (!this.isDiving && this.currentDepth <= 0 && this.gameStarted) {
            this.endGame(true); // 成功完成挑战
        }
    }

    resetPosition() {
        this.currentDepth = 0;
        this.gameArea.scrollTop = 0;
        this.diver.style.top = '0px';
        this.diver.classList.remove('floating'); // 重置潜水员方向
        this.updateBackground();
        
        // 重置所有生物的位置
        this.creatures.forEach(creature => {
            const depth = parseFloat(creature.dataset.depth);
            creature.style.top = `${depth * 50}px`;
        });
    }

    toggleGame() {
        if (!this.gameStarted) {
            this.startGame();
        } else {
            this.endGame();
        }
    }

    setDirection(diving) {
        this.isDiving = diving;
        this.diveBtn.disabled = diving;
        this.floatBtn.disabled = !diving;
        
        // 更新潜水员方向
        if (diving) {
            this.diver.classList.remove('floating');
        } else {
            this.diver.classList.add('floating');
        }
    }
}

window.addEventListener('load', () => {
    new DivingGame();
});
