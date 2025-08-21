// 游戏状态管理
class GameState {
    constructor() {
        this.character = {
            level: 1,
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5,
            experience: 0,
            experienceToNext: 100,
            gold: 0,
            isAlive: true,
            combo: 0,
            maxCombo: 0,
            isBerserk: false,
            berserkTurns: 0
        };
        
        this.currentEnemy = null;
        this.battleInProgress = false;
        this.autoAttackInterval = null;
        
        this.skills = {
            fireball: { level: 1, damage: 15, cost: 10, cooldown: 0, maxCooldown: 3 },
            heal: { level: 1, healing: 20, cost: 15, cooldown: 0, maxCooldown: 5 },
            shield: { level: 1, defense: 10, cost: 12, cooldown: 0, maxCooldown: 4 },
            lightning: { level: 1, damage: 25, cost: 20, cooldown: 0, maxCooldown: 6 },
            berserk: { level: 1, duration: 3, cost: 25, cooldown: 0, maxCooldown: 8 },
            drain: { level: 1, damage: 12, healing: 8, cost: 18, cooldown: 0, maxCooldown: 5 },
            meteor: { level: 1, damage: 40, cost: 35, cooldown: 0, maxCooldown: 10 }
        };
        
        this.achievements = {
            firstKill: { name: "初次击杀", description: "击败第一个敌人", unlocked: false, reward: 50 },
            levelUp: { name: "等级提升", description: "达到等级5", unlocked: false, reward: 100 },
            goldCollector: { name: "金币收集者", description: "收集1000金币", unlocked: false, reward: 200 },
            comboMaster: { name: "连击大师", description: "达到10连击", unlocked: false, reward: 150 },
            bossSlayer: { name: "BOSS杀手", description: "击败第一个BOSS", unlocked: false, reward: 300 },
            skillMaster: { name: "技能大师", description: "将任意技能升级到5级", unlocked: false, reward: 250 },
            survivor: { name: "生存者", description: "在一场战斗中生命值降到10以下但存活", unlocked: false, reward: 100 }
        };
        
        this.enemyTemplates = {
            regular: [
                { name: "哥布林", sprite: "👹", health: 50, attack: 8, defense: 2, experience: 25, gold: 10 },
                { name: "骷髅兵", sprite: "💀", health: 70, attack: 12, defense: 4, experience: 35, gold: 15 },
                { name: "兽人", sprite: "👺", health: 90, attack: 15, defense: 6, experience: 45, gold: 20 },
                { name: "暗影刺客", sprite: "🥷", health: 60, attack: 20, defense: 3, experience: 40, gold: 25 },
                { name: "石头巨人", sprite: "🗿", health: 150, attack: 10, defense: 15, experience: 60, gold: 30 }
            ],
            boss: [
                { name: "哥布林王", sprite: "👑", health: 200, attack: 25, defense: 10, experience: 150, gold: 100, level: 5, skills: ["charge", "roar"] },
                { name: "骷髅领主", sprite: "☠️", health: 300, attack: 30, defense: 15, experience: 200, gold: 150, level: 10, skills: ["necromancy", "bone_armor"] },
                { name: "暗黑法师", sprite: "🧙‍♂️", health: 250, attack: 35, defense: 8, experience: 250, gold: 200, level: 15, skills: ["dark_magic", "teleport"] },
                { name: "龙王", sprite: "🐉", health: 500, attack: 45, defense: 20, experience: 400, gold: 300, level: 20, skills: ["fire_breath", "fly", "rage"] }
            ]
        };
        
        this.combatState = {
            playerTurn: true,
            turnCount: 0,
            lastAction: ""
        };
    }
    
    // 保存游戏状态
    save() {
        const saveData = {
            character: this.character,
            skills: this.skills,
            achievements: this.achievements,
            combatState: this.combatState
        };
        localStorage.setItem('idleARPGSave', JSON.stringify(saveData));
    }
    
    // 加载游戏状态
    load() {
        const saveData = localStorage.getItem('idleARPGSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.character = { ...this.character, ...data.character };
            this.skills = { ...this.skills, ...data.skills };
            this.achievements = { ...this.achievements, ...data.achievements };
            this.combatState = { ...this.combatState, ...data.combatState };
        }
    }
}

// 全局游戏状态
const gameState = new GameState();

// 敌人生成
function generateEnemy() {
    const isBoss = Math.random() < 0.1 && gameState.character.level >= 5; // 10%概率生成BOSS，需要等级5+
    
    let template;
    if (isBoss) {
        const availableBosses = gameState.enemyTemplates.boss.filter(boss => 
            gameState.character.level >= boss.level
        );
        template = availableBosses[Math.floor(Math.random() * availableBosses.length)] || gameState.enemyTemplates.boss[0];
    } else {
        template = gameState.enemyTemplates.regular[Math.floor(Math.random() * gameState.enemyTemplates.regular.length)];
    }
    
    // 根据角色等级调整敌人属性
    const levelMultiplier = 1 + (gameState.character.level - 1) * 0.2;
    
    return {
        ...template,
        maxHealth: Math.floor(template.health * levelMultiplier),
        health: Math.floor(template.health * levelMultiplier),
        attack: Math.floor(template.attack * levelMultiplier),
        defense: Math.floor(template.defense * levelMultiplier),
        experience: Math.floor(template.experience * levelMultiplier),
        gold: Math.floor(template.gold * levelMultiplier),
        isBoss: isBoss
    };
}

// 战斗逻辑
function performAttack() {
    if (!gameState.currentEnemy || !gameState.character.isAlive) return;
    
    // 角色攻击
    let damage = gameState.character.attack + Math.floor(Math.random() * 10) - 5; // 随机伤害
    
    // 连击加成
    if (gameState.character.combo > 0) {
        damage += Math.floor(gameState.character.combo * 0.5);
    }
    
    // 狂暴状态加成
    if (gameState.character.isBerserk) {
        damage = Math.floor(damage * 1.5);
        gameState.character.berserkTurns--;
        if (gameState.character.berserkTurns <= 0) {
            gameState.character.isBerserk = false;
            addBattleLog("狂暴状态结束！");
        }
    }
    
    // 暴击判定
    const isCritical = Math.random() < 0.15; // 15%暴击率
    if (isCritical) {
        damage = Math.floor(damage * 2);
        gameState.character.combo++;
        addBattleLog(`暴击！造成 ${damage} 点伤害！连击数: ${gameState.character.combo}`);
        
        // 更新最大连击数
        if (gameState.character.combo > gameState.character.maxCombo) {
            gameState.character.maxCombo = gameState.character.combo;
        }
        
        // 检查连击成就
        if (gameState.character.combo >= 10 && !gameState.achievements.comboMaster.unlocked) {
            unlockAchievement('comboMaster');
        }
    } else {
        gameState.character.combo = 0; // 非暴击重置连击
        addBattleLog(`攻击造成 ${damage} 点伤害！`);
    }
    
    // 应用伤害
    damage = Math.max(1, damage - gameState.currentEnemy.defense);
    gameState.currentEnemy.health -= damage;
    
    // 添加攻击动画
    document.getElementById('character').classList.add('attack');
    document.getElementById('enemy').classList.add('hit');
    
    setTimeout(() => {
        document.getElementById('character').classList.remove('attack');
        document.getElementById('enemy').classList.remove('hit');
    }, 400);
    
    // 检查敌人是否死亡
    if (gameState.currentEnemy.health <= 0) {
        enemyDefeated();
        return;
    }
    
    // 敌人反击
    setTimeout(() => {
        if (gameState.currentEnemy && gameState.currentEnemy.health > 0) {
            enemyAttack();
        }
    }, 800);
}

// 敌人攻击
function enemyAttack() {
    if (!gameState.currentEnemy || !gameState.character.isAlive) return;
    
    let damage = gameState.currentEnemy.attack + Math.floor(Math.random() * 6) - 3;
    damage = Math.max(1, damage - gameState.character.defense);
    
    gameState.character.health -= damage;
    addBattleLog(`${gameState.currentEnemy.name} 攻击造成 ${damage} 点伤害！`);
    
    // 添加受击动画
    document.getElementById('character').classList.add('hit');
    document.getElementById('enemy').classList.add('attack');
    
    setTimeout(() => {
        document.getElementById('character').classList.remove('hit');
        document.getElementById('enemy').classList.remove('attack');
    }, 400);
    
    // 检查角色是否死亡
    if (gameState.character.health <= 0) {
        characterDefeated();
        return;
    }
    
    // 检查生存者成就
    if (gameState.character.health <= 10 && !gameState.achievements.survivor.unlocked) {
        unlockAchievement('survivor');
    }
    
    updateDisplay();
}

// 敌人被击败
function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    
    // 获得经验和金币
    gameState.character.experience += enemy.experience;
    gameState.character.gold += enemy.gold;
    
    addBattleLog(`击败了 ${enemy.name}！获得 ${enemy.experience} 经验值和 ${enemy.gold} 金币！`);
    
    // 检查成就
    if (!gameState.achievements.firstKill.unlocked) {
        unlockAchievement('firstKill');
    }
    
    if (enemy.isBoss && !gameState.achievements.bossSlayer.unlocked) {
        unlockAchievement('bossSlayer');
    }
    
    if (gameState.character.gold >= 1000 && !gameState.achievements.goldCollector.unlocked) {
        unlockAchievement('goldCollector');
    }
    
    // 检查升级
    checkLevelUp();
    
    // 生成新敌人
    gameState.currentEnemy = generateEnemy();
    
    updateDisplay();
    gameState.save();
}

// 角色被击败
function characterDefeated() {
    gameState.character.isAlive = false;
    gameState.character.health = 0;
    addBattleLog("你被击败了！3秒后复活...");
    
    // 停止自动攻击
    if (gameState.autoAttackInterval) {
        clearInterval(gameState.autoAttackInterval);
        gameState.autoAttackInterval = null;
    }
    
    // 3秒后复活
    setTimeout(() => {
        gameState.character.isAlive = true;
        gameState.character.health = gameState.character.maxHealth;
        gameState.character.combo = 0;
        addBattleLog("你复活了！");
        updateDisplay();
        
        // 重新开始自动攻击
        startAutoAttack();
    }, 3000);
    
    updateDisplay();
}

// 检查升级
function checkLevelUp() {
    while (gameState.character.experience >= gameState.character.experienceToNext) {
        gameState.character.experience -= gameState.character.experienceToNext;
        gameState.character.level++;
        
        // 提升属性
        gameState.character.maxHealth += 20;
        gameState.character.health = gameState.character.maxHealth; // 升级时回满血
        gameState.character.attack += 3;
        gameState.character.defense += 2;
        gameState.character.experienceToNext = Math.floor(gameState.character.experienceToNext * 1.2);
        
        addBattleLog(`等级提升！现在是 ${gameState.character.level} 级！`);
        
        // 检查等级成就
        if (gameState.character.level >= 5 && !gameState.achievements.levelUp.unlocked) {
            unlockAchievement('levelUp');
        }
        
        // 添加升级动画
        document.getElementById('character').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('character').classList.remove('pulse');
        }, 300);
    }
}

// 使用技能
function useSkill(skillName) {
    const skill = gameState.skills[skillName];
    if (!skill || skill.cooldown > 0 || gameState.character.gold < skill.cost) {
        return false;
    }
    
    gameState.character.gold -= skill.cost;
    skill.cooldown = skill.maxCooldown;
    
    switch (skillName) {
        case 'fireball':
            if (gameState.currentEnemy) {
                const damage = skill.damage + skill.level * 5;
                gameState.currentEnemy.health -= damage;
                addBattleLog(`释放火球术！造成 ${damage} 点伤害！`);
                if (gameState.currentEnemy.health <= 0) {
                    enemyDefeated();
                }
            }
            break;
            
        case 'heal':
            const healing = skill.healing + skill.level * 3;
            gameState.character.health = Math.min(gameState.character.maxHealth, gameState.character.health + healing);
            addBattleLog(`使用治疗术！恢复 ${healing} 点生命值！`);
            break;
            
        case 'shield':
            gameState.character.defense += skill.defense + skill.level * 2;
            addBattleLog(`使用护盾术！防御力临时提升！`);
            setTimeout(() => {
                gameState.character.defense -= (skill.defense + skill.level * 2);
            }, 10000); // 10秒持续时间
            break;
            
        case 'lightning':
            if (gameState.currentEnemy) {
                const damage = skill.damage + skill.level * 8;
                gameState.currentEnemy.health -= damage;
                addBattleLog(`释放闪电术！造成 ${damage} 点伤害！`);
                if (gameState.currentEnemy.health <= 0) {
                    enemyDefeated();
                }
            }
            break;
            
        case 'berserk':
            gameState.character.isBerserk = true;
            gameState.character.berserkTurns = skill.duration + skill.level;
            addBattleLog(`进入狂暴状态！攻击力提升50%！`);
            break;
            
        case 'drain':
            if (gameState.currentEnemy) {
                const damage = skill.damage + skill.level * 3;
                const healing = skill.healing + skill.level * 2;
                gameState.currentEnemy.health -= damage;
                gameState.character.health = Math.min(gameState.character.maxHealth, gameState.character.health + healing);
                addBattleLog(`释放吸血术！造成 ${damage} 点伤害并恢复 ${healing} 点生命值！`);
                if (gameState.currentEnemy.health <= 0) {
                    enemyDefeated();
                }
            }
            break;
            
        case 'meteor':
            if (gameState.currentEnemy) {
                const damage = skill.damage + skill.level * 15;
                gameState.currentEnemy.health -= damage;
                addBattleLog(`召唤陨石！造成 ${damage} 点巨额伤害！`);
                if (gameState.currentEnemy.health <= 0) {
                    enemyDefeated();
                }
            }
            break;
    }
    
    updateDisplay();
    gameState.save();
    return true;
}

// 升级技能
function upgradeSkill(skillName) {
    const skill = gameState.skills[skillName];
    const cost = skill.level * 100;
    
    if (gameState.character.gold >= cost) {
        gameState.character.gold -= cost;
        skill.level++;
        addBattleLog(`${skillName} 升级到 ${skill.level} 级！`);
        
        // 检查技能大师成就
        if (skill.level >= 5 && !gameState.achievements.skillMaster.unlocked) {
            unlockAchievement('skillMaster');
        }
        
        updateDisplay();
        gameState.save();
        return true;
    }
    return false;
}

// 解锁成就
function unlockAchievement(achievementKey) {
    const achievement = gameState.achievements[achievementKey];
    if (!achievement.unlocked) {
        achievement.unlocked = true;
        gameState.character.gold += achievement.reward;
        addBattleLog(`🏆 成就解锁: ${achievement.name}！获得 ${achievement.reward} 金币奖励！`);
        updateDisplay();
        gameState.save();
    }
}

// 添加战斗日志
function addBattleLog(message) {
    const logContent = document.getElementById('battleLog');
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
    
    // 限制日志条数
    while (logContent.children.length > 50) {
        logContent.removeChild(logContent.firstChild);
    }
}

// 开始自动攻击
function startAutoAttack() {
    if (gameState.autoAttackInterval) {
        clearInterval(gameState.autoAttackInterval);
    }
    
    gameState.autoAttackInterval = setInterval(() => {
        if (gameState.character.isAlive && gameState.currentEnemy) {
            performAttack();
        }
    }, 2000); // 每2秒攻击一次
}

// 停止自动攻击
function stopAutoAttack() {
    if (gameState.autoAttackInterval) {
        clearInterval(gameState.autoAttackInterval);
        gameState.autoAttackInterval = null;
    }
}

// 更新显示
function updateDisplay() {
    // 更新角色状态
    document.getElementById('level').textContent = gameState.character.level;
    document.getElementById('health').textContent = `${gameState.character.health}/${gameState.character.maxHealth}`;
    document.getElementById('attack').textContent = gameState.character.attack;
    document.getElementById('defense').textContent = gameState.character.defense;
    document.getElementById('experience').textContent = `${gameState.character.experience}/${gameState.character.experienceToNext}`;
    document.getElementById('gold').textContent = gameState.character.gold;
    
    // 更新经验条
    const expPercentage = (gameState.character.experience / gameState.character.experienceToNext) * 100;
    document.getElementById('experienceBar').style.width = `${expPercentage}%`;
    
    // 更新敌人信息
    if (gameState.currentEnemy) {
        document.getElementById('enemySprite').textContent = gameState.currentEnemy.sprite;
        document.getElementById('enemyName').textContent = gameState.currentEnemy.name + (gameState.currentEnemy.isBoss ? ' (BOSS)' : '');
        document.getElementById('enemyHealth').textContent = `${gameState.currentEnemy.health}/${gameState.currentEnemy.maxHealth}`;
    }
    
    // 更新技能冷却
    Object.keys(gameState.skills).forEach(skillName => {
        const skill = gameState.skills[skillName];
        if (skill.cooldown > 0) {
            skill.cooldown--;
        }
    });
    
    updateSkillsDisplay();
    updateUpgradesDisplay();
    updateAchievementsDisplay();
}

// 更新技能显示
function updateSkillsDisplay() {
    const skillsGrid = document.getElementById('skillsGrid');
    skillsGrid.innerHTML = '';
    
    Object.keys(gameState.skills).forEach(skillName => {
        const skill = gameState.skills[skillName];
        const button = document.createElement('button');
        button.className = 'skill-button';
        button.textContent = `${skillName} (Lv.${skill.level}) - ${skill.cost}金币`;
        
        if (skill.cooldown > 0) {
            button.textContent += ` (冷却: ${skill.cooldown})`;
            button.disabled = true;
        } else if (gameState.character.gold < skill.cost) {
            button.disabled = true;
        }
        
        button.onclick = () => useSkill(skillName);
        skillsGrid.appendChild(button);
    });
}

// 更新升级显示
function updateUpgradesDisplay() {
    const upgradesGrid = document.getElementById('upgradesGrid');
    upgradesGrid.innerHTML = '';
    
    Object.keys(gameState.skills).forEach(skillName => {
        const skill = gameState.skills[skillName];
        const cost = skill.level * 100;
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = `升级 ${skillName} - ${cost}金币`;
        
        if (gameState.character.gold < cost) {
            button.disabled = true;
        }
        
        button.onclick = () => upgradeSkill(skillName);
        upgradesGrid.appendChild(button);
    });
}

// 更新成就显示
function updateAchievementsDisplay() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    achievementsGrid.innerHTML = '';
    
    Object.keys(gameState.achievements).forEach(achievementKey => {
        const achievement = gameState.achievements[achievementKey];
        const div = document.createElement('div');
        div.className = `achievement ${achievement.unlocked ? '' : 'locked'}`;
        
        div.innerHTML = `
            <div class="achievement-name">${achievement.name} ${achievement.unlocked ? '✅' : '🔒'}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-reward">奖励: ${achievement.reward} 金币</div>
        `;
        
        achievementsGrid.appendChild(div);
    });
}

// 游戏初始化
function initGame() {
    gameState.load();
    
    if (!gameState.currentEnemy) {
        gameState.currentEnemy = generateEnemy();
    }
    
    updateDisplay();
    startAutoAttack();
    
    // 定期保存游戏
    setInterval(() => {
        gameState.save();
    }, 10000); // 每10秒保存一次
    
    // 定期更新显示
    setInterval(() => {
        updateDisplay();
    }, 1000); // 每秒更新一次
    
    addBattleLog("游戏开始！自动战斗已启动！");
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);