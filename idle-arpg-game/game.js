// 游戏状态管理
class GameState {
    constructor() {
        // 角色数据
        this.character = {
            level: 1,
            hp: 150, // 增强基础生命值
            maxHp: 150,
            attack: 15, // 增强基础攻击力
            exp: 0,
            maxExp: 100,
            upgradePoints: 0,
            shield: 0, // 护盾值
            criticalRate: 0.15 // 基础暴击率15%
        };
        
        // 当前敌人数据
        this.currentEnemy = null;
        
        // 敌人模板
        this.enemyTemplates = [
            { name: '史莱姆', hp: 50, attack: 8, expReward: 20, emoji: '🟢' },
            { name: '哥布林', hp: 80, attack: 12, expReward: 35, emoji: '👺' },
            { name: '骷髅战士', hp: 120, attack: 15, expReward: 50, emoji: '💀' },
            { name: '兽人', hp: 180, attack: 20, expReward: 75, emoji: '👹' },
            { name: '巨魔', hp: 250, attack: 25, expReward: 100, emoji: '🧌' }
        ];
        
        // BOSS敌人模板
        this.bossTemplates = [
            { name: '史莱姆王', hp: 300, attack: 35, expReward: 200, emoji: '👑', level: 5, isBoss: true, skills: ['毒液喷射'] },
            { name: '哥布林酋长', hp: 500, attack: 50, expReward: 350, emoji: '🗿', level: 10, isBoss: true, skills: ['战吼', '重击'] },
            { name: '骷髅领主', hp: 750, attack: 65, expReward: 500, emoji: '☠️', level: 15, isBoss: true, skills: ['死亡凝视', '骨矛'] },
            { name: '兽人王', hp: 1000, attack: 80, expReward: 750, emoji: '👹', level: 20, isBoss: true, skills: ['狂暴', '地震'] },
            { name: '古代巨魔', hp: 1500, attack: 100, expReward: 1200, emoji: '🧌', level: 25, isBoss: true, skills: ['再生', '巨石投掷'] }
        ];
        
        // BOSS战斗状态
        this.bossState = {
            isBossFight: false,
            bossDefeatedCount: 0,
            nextBossLevel: 5,
            bossSkillCooldown: 0
        };
        
        // 成就系统
        this.achievements = {
            firstKill: { name: '初次击杀', description: '击败第一个敌人', unlocked: false, reward: 10 },
            bossSlayer: { name: 'BOSS杀手', description: '击败第一个BOSS', unlocked: false, reward: 50 },
            comboMaster: { name: '连击大师', description: '达到10连击', unlocked: false, reward: 25 },
            skillMaster: { name: '技能大师', description: '将任意技能升级到满级', unlocked: false, reward: 100 },
            survivor: { name: '幸存者', description: '生命值降到10以下后存活', unlocked: false, reward: 30 },
            levelUp10: { name: '十级战士', description: '达到10级', unlocked: false, reward: 75 }
        };
        
        // 游戏循环定时器
        this.gameLoop = null;
        this.battleLogMessages = [];
        
        // 技能系统（包含升级系统）
        this.skills = {
            fireball: {
                name: '火球术',
                icon: '🔥',
                level: 1,
                maxLevel: 5,
                baseDamage: 35,
                get damage() { return this.baseDamage + (this.level - 1) * 15; },
                cooldown: 4000, // 减少冷却时间
                lastUsed: 0,
                description: '发射火球造成高额伤害'
            },
            heal: {
                name: '治疗术',
                icon: '💚',
                level: 1,
                maxLevel: 5,
                baseHealAmount: 45,
                get healAmount() { return this.baseHealAmount + (this.level - 1) * 20; },
                cooldown: 6000, // 减少冷却时间
                lastUsed: 0,
                description: '恢复生命值'
            },
            critical: {
                name: '暴击攻击',
                icon: '⚡',
                level: 1,
                maxLevel: 5,
                get multiplier() { return 3.0 + (this.level - 1) * 0.5; },
                cooldown: 5000, // 减少冷却时间
                lastUsed: 0,
                description: '下次攻击造成暴击伤害'
            },
            lightningChain: {
                name: '闪电链',
                icon: '⚡',
                level: 1,
                maxLevel: 5,
                baseDamage: 40,
                get damage() { return this.baseDamage + (this.level - 1) * 18; },
                chainCount: 3,
                cooldown: 8000,
                lastUsed: 0,
                description: '释放闪电链，造成连锁伤害'
            },
            shield: {
                name: '护盾术',
                icon: '🛡️',
                level: 1,
                maxLevel: 5,
                baseShieldAmount: 50,
                get shieldAmount() { return this.baseShieldAmount + (this.level - 1) * 30; },
                duration: 15000, // 15秒持续时间
                cooldown: 12000,
                lastUsed: 0,
                description: '为英雄提供护盾，吸收伤害'
            },
            berserk: {
                name: '狂暴模式',
                icon: '🔥',
                level: 1,
                maxLevel: 5,
                get attackBonus() { return 2.0 + (this.level - 1) * 0.2; },
                speedBonus: 0.5,
                get duration() { return 10000 + (this.level - 1) * 2000; },
                cooldown: 20000,
                lastUsed: 0,
                description: '进入狂暴状态，大幅提升攻击力和速度'
            },
            lifeDrain: {
                name: '生命汲取',
                icon: '🩸',
                level: 1,
                maxLevel: 5,
                get drainPercent() { return 0.3 + (this.level - 1) * 0.15; },
                get duration() { return 8000 + (this.level - 1) * 3000; },
                cooldown: 15000,
                lastUsed: 0,
                description: '攻击时恢复自身生命值'
            }
        };
        
        // 战斗状态
        this.combatState = {
            nextAttackIsCritical: false,
            comboCount: 0,
            lastAttackTime: 0,
            berserkActive: false,
            berserkEndTime: 0,
            lifeDrainActive: false,
            lifeDrainEndTime: 0,
            shieldActive: false,
            shieldEndTime: 0
        };
        
        // 初始化游戏
        this.init();
    }
    
    init() {
        // 加载游戏数据
        this.loadGame();
        
        // 生成第一个敌人
        this.generateEnemy();
        
        // 更新UI
        this.updateUI();
        
        // 绑定事件
        this.bindEvents();
        
        // 开始游戏循环
        this.startGameLoop();
        
        this.addBattleLog('游戏开始！准备战斗！');
    }
    
    // 生成敌人
    generateEnemy() {
        // 检查是否应该生成BOSS
        if (this.character.level >= this.bossState.nextBossLevel && !this.bossState.isBossFight) {
            this.generateBoss();
            return;
        }
        
        // 根据角色等级选择合适的敌人
        const enemyIndex = Math.min(
            Math.floor((this.character.level - 1) / 2),
            this.enemyTemplates.length - 1
        );
        
        const template = this.enemyTemplates[enemyIndex];
        
        // 添加一些随机性
        const hpVariation = Math.floor(template.hp * 0.2 * (Math.random() - 0.5));
        const attackVariation = Math.floor(template.attack * 0.2 * (Math.random() - 0.5));
        
        this.currentEnemy = {
            name: template.name,
            hp: template.hp + hpVariation,
            maxHp: template.hp + hpVariation,
            attack: template.attack + attackVariation,
            expReward: template.expReward,
            emoji: template.emoji,
            isBoss: false
        };
        
        this.addBattleLog(`遭遇了 ${this.currentEnemy.name}！`);
    }
    
    // 生成BOSS
    generateBoss() {
        const bossIndex = Math.min(
            this.bossState.bossDefeatedCount,
            this.bossTemplates.length - 1
        );
        
        const template = this.bossTemplates[bossIndex];
        
        this.currentEnemy = {
            name: template.name,
            hp: template.hp,
            maxHp: template.hp,
            attack: template.attack,
            expReward: template.expReward,
            emoji: template.emoji,
            isBoss: true,
            skills: template.skills,
            level: template.level
        };
        
        this.bossState.isBossFight = true;
        this.bossState.bossSkillCooldown = 0;
        
        this.addBattleLog(`⚠️ 强大的BOSS ${this.currentEnemy.name} 出现了！`);
        this.addBattleLog(`🔥 这将是一场艰难的战斗！`);
        
        // BOSS出现特效
        this.triggerScreenShake();
        this.createParticleEffect('critical', { x: 350, y: 200 }, 15);
    }
    
    // 战斗逻辑
    battle() {
        if (!this.currentEnemy || this.character.hp <= 0) return;
        
        const currentTime = Date.now();
        
        // 更新状态效果
        this.updateStatusEffects(currentTime);
        
        // 角色攻击敌人
        let damage = this.character.attack + Math.floor(Math.random() * 8) + 2; // 增加随机伤害范围和基础伤害
        
        // 连击加成系统优化 - 连击越高伤害加成越大
        const comboBonus = Math.min(this.combatState.comboCount * 0.15, 2.0); // 每连击增加15%伤害，最高200%
        damage = Math.floor(damage * (1 + comboBonus));
        
        // 狂暴状态加成
        if (this.combatState.berserkActive) {
            damage = Math.floor(damage * 1.8); // 狂暴状态下伤害增加80%
        }
        
        // 检查是否暴击
        let isCritical = false;
        const criticalChance = this.character.criticalRate + (this.combatState.berserkActive ? 0.2 : 0); // 狂暴状态下暴击率提升更多
        if (this.combatState.nextAttackIsCritical || Math.random() < criticalChance) {
            damage = Math.floor(damage * this.skills.critical.multiplier);
            isCritical = true;
            this.combatState.nextAttackIsCritical = false;
            this.triggerCriticalFlash(); // 暴击闪光效果
        }
        
        // 连击系统
        const timeSinceLastAttack = currentTime - this.combatState.lastAttackTime;
        if (timeSinceLastAttack < 2000) {
            this.combatState.comboCount++;
            if (this.combatState.comboCount >= 3) {
                damage = Math.floor(damage * 1.2);
                this.addBattleLog(`🔥 连击 x${this.combatState.comboCount}！伤害提升！`);
            }
        } else {
            this.combatState.comboCount = 1;
        }
        this.combatState.lastAttackTime = currentTime;
        this.updateComboDisplay();
        
        // 音效提示（用emoji表示）
        if (isCritical) {
            this.showSoundEffect('💥');
        } else if (this.combatState.comboCount > 1) {
            this.showSoundEffect('⚡');
        } else {
            this.showSoundEffect('🗡️');
        }
        
        this.currentEnemy.hp -= damage;
        
        // 生命汲取效果
        if (this.combatState.lifeDrainActive) {
            const drainAmount = Math.floor(damage * this.skills.lifeDrain.drainPercent);
            const actualHeal = Math.min(drainAmount, this.character.maxHp - this.character.hp);
            this.character.hp += actualHeal;
            if (actualHeal > 0) {
                this.showDamageNumber(actualHeal, 'heal');
                this.addBattleLog(`🩸 生命汲取恢复了 ${actualHeal} 点生命值！`);
            }
        }
            
        // 触发攻击动画
        this.triggerAttackAnimation('hero');
        this.triggerHitAnimation('enemy');
        
        if (isCritical) {
            this.addBattleLog(`💥 勇者暴击攻击 ${this.currentEnemy.name}，造成 ${damage} 点伤害！`);
            this.showDamageNumber(damage, 'critical');
            // 暴击粒子特效
            this.createParticleEffect('critical', { x: 250, y: 200 }, 8);
        } else {
            this.addBattleLog(`⚔️ 勇者攻击 ${this.currentEnemy.name}，造成 ${damage} 点伤害`);
            this.showDamageNumber(damage, 'normal');
        }
        
        // 显示连击特效
        if (this.combatState.comboCount > 1) {
            this.showComboEffect(this.combatState.comboCount);
        }
        
        // 检查敌人是否死亡
        if (this.currentEnemy.hp <= 0) {
            if (this.currentEnemy.isBoss) {
                this.addBattleLog(`🎉 恭喜！BOSS ${this.currentEnemy.name} 被击败了！`);
                this.addBattleLog(`🏆 获得了丰厚的奖励！`);
                
                // BOSS击败特效
                this.triggerScreenShake();
                this.createParticleEffect('critical', { x: 350, y: 200 }, 20);
                
                // 更新BOSS状态
                this.bossState.isBossFight = false;
                this.bossState.bossDefeatedCount++;
                this.bossState.nextBossLevel += 5;
                
                // 检查BOSS杀手成就
                this.checkAchievement('bossSlayer');
            } else {
                this.addBattleLog(`${this.currentEnemy.name} 被击败了！💀`);
                
                // 检查首次击杀成就
                this.checkAchievement('firstKill');
            }
            
            this.gainExp(this.currentEnemy.expReward);
            
            // 重置连击
            this.combatState.comboCount = 0;
            
            // 生成新敌人
            setTimeout(() => {
                this.generateEnemy();
                this.updateUI();
            }, 1000);
            
            return;
        }
        
        // 敌人攻击角色
        this.enemyAttack();
        
        // 检查角色是否死亡
        if (this.character.hp <= 0) {
            this.character.hp = 0;
            this.addBattleLog('勇者被击败了！💀 将在5秒后复活...');
            
            // 重置连击和暴击状态
            this.combatState.comboCount = 0;
            this.combatState.nextAttackIsCritical = false;
            
            setTimeout(() => {
                this.character.hp = this.character.maxHp;
                this.addBattleLog('勇者复活了！💪 继续战斗！');
                this.updateUI();
            }, 5000);
        }
    }
    
    // 获得经验值
    gainExp(amount) {
        this.character.exp += amount;
        this.addBattleLog(`获得 ${amount} 点经验值！`);
        
        // 检查是否可以升级
        while (this.character.exp >= this.character.maxExp) {
            this.levelUp();
        }
    }
    
    // 升级
    levelUp() {
        this.character.exp -= this.character.maxExp;
        this.character.level++;
        this.character.upgradePoints++;
        
        // 升级时恢复满血
        this.character.hp = this.character.maxHp;
        
        // 增加下一级所需经验
        this.character.maxExp = Math.floor(this.character.maxExp * 1.5);
        
        this.addBattleLog(`🎉 恭喜！升级到 ${this.character.level} 级！获得1个升级点！`);
        
        // 检查升级成就
        this.checkAchievement('levelUp');
    }
    
    // 使用技能
    useSkill(skillName) {
        const skill = this.skills[skillName];
        if (!skill) return false;
        
        const currentTime = Date.now();
        const timeSinceLastUse = currentTime - skill.lastUsed;
        
        // 检查冷却时间
        if (timeSinceLastUse < skill.cooldown) {
            const remainingCooldown = Math.ceil((skill.cooldown - timeSinceLastUse) / 1000);
            this.addBattleLog(`${skill.name} 还在冷却中，剩余 ${remainingCooldown} 秒！`);
            return false;
        }
        
        // 检查角色是否死亡
        if (this.character.hp <= 0) {
            this.addBattleLog('勇者已死亡，无法使用技能！');
            return false;
        }
        
        skill.lastUsed = currentTime;
        
        switch (skillName) {
            case 'fireball':
                if (this.currentEnemy) {
                    const damage = skill.damage + Math.floor(Math.random() * 10);
                    this.currentEnemy.hp -= damage;
                    this.addBattleLog(`🔥 勇者释放火球术，对 ${this.currentEnemy.name} 造成 ${damage} 点火焰伤害！`);
                    this.showSkillEffect('🔥', 'fireball');
                    this.showDamageNumber(damage, 'skill');
                    // 火球术粒子特效
                    this.createParticleEffect('skill', { x: 350, y: 200 }, 6);
                    
                    // 检查敌人是否死亡
                    if (this.currentEnemy.hp <= 0) {
                        this.addBattleLog(`${this.currentEnemy.name} 被火球术烧死了！💀🔥`);
                        this.gainExp(this.currentEnemy.expReward);
                        setTimeout(() => {
                            this.generateEnemy();
                            this.updateUI();
                        }, 1000);
                    }
                }
                break;
                
            case 'heal':
                const healAmount = skill.healAmount + Math.floor(Math.random() * 10);
                const actualHeal = Math.min(healAmount, this.character.maxHp - this.character.hp);
                this.character.hp += actualHeal;
                this.addBattleLog(`💚 勇者使用治疗术，恢复了 ${actualHeal} 点生命值！`);
                this.showSkillEffect('💚', 'heal');
                this.showDamageNumber(actualHeal, 'heal');
                // 治疗术粒子特效
                this.createParticleEffect('skill', { x: 150, y: 200 }, 5);
                break;
                
            case 'critical':
                this.combatState.nextAttackIsCritical = true;
                this.addBattleLog(`⚡ 勇者蓄力完成，下次攻击将造成暴击伤害！`);
                this.showSkillEffect('⚡', 'critical');
                break;
                
            case 'lightningChain':
                if (this.currentEnemy) {
                    const damage = skill.damage + Math.floor(Math.random() * 15);
                    this.currentEnemy.hp -= damage;
                    this.addBattleLog(`⚡ 勇者释放闪电链，对 ${this.currentEnemy.name} 造成 ${damage} 点雷电伤害！`);
                    this.showSkillEffect('⚡', 'lightningChain');
                    this.showDamageNumber(damage, 'lightning');
                    // 闪电链粒子特效
                    this.createParticleEffect('skill', { x: 350, y: 200 }, 10);
                    
                    // 连锁效果（模拟多次小伤害）
                    for (let i = 1; i < skill.chainCount && this.currentEnemy.hp > 0; i++) {
                        setTimeout(() => {
                            if (this.currentEnemy && this.currentEnemy.hp > 0) {
                                const chainDamage = Math.floor(damage * 0.6);
                                this.currentEnemy.hp -= chainDamage;
                                this.addBattleLog(`⚡ 闪电链连锁第${i+1}段，造成 ${chainDamage} 点伤害！`);
                                this.showDamageNumber(chainDamage, 'lightning');
                                this.updateUI();
                            }
                        }, i * 300);
                    }
                    
                    // 检查敌人是否死亡
                    setTimeout(() => {
                        if (this.currentEnemy && this.currentEnemy.hp <= 0) {
                            this.addBattleLog(`${this.currentEnemy.name} 被闪电链电死了！💀⚡`);
                            this.gainExp(this.currentEnemy.expReward);
                            setTimeout(() => {
                                this.generateEnemy();
                                this.updateUI();
                            }, 1000);
                        }
                    }, skill.chainCount * 300);
                }
                break;
                
            case 'shield':
                this.character.shield += skill.shieldAmount;
                this.combatState.shieldActive = true;
                this.combatState.shieldEndTime = currentTime + skill.duration;
                this.addBattleLog(`🛡️ 勇者获得了 ${skill.shieldAmount} 点护盾！`);
                this.showSkillEffect('🛡️', 'shield');
                this.showDamageNumber(skill.shieldAmount, 'shield');
                break;
                
            case 'berserk':
                this.combatState.berserkActive = true;
                this.combatState.berserkEndTime = currentTime + skill.duration;
                this.addBattleLog(`🔥 勇者进入狂暴状态！攻击力和暴击率大幅提升！`);
                this.showSkillEffect('🔥', 'berserk');
                break;
                
            case 'lifeDrain':
                this.combatState.lifeDrainActive = true;
                this.combatState.lifeDrainEndTime = currentTime + skill.duration;
                this.addBattleLog(`🩸 勇者开启生命汲取！攻击时将恢复生命值！`);
                this.showSkillEffect('🩸', 'lifeDrain');
                break;
        }
        
        this.updateSkillCooldowns();
        this.updateUI();
        this.saveGame();
        return true;
    }
    
    // 更新状态效果
    updateStatusEffects(currentTime) {
        // 检查狂暴状态
        if (this.combatState.berserkActive && currentTime >= this.combatState.berserkEndTime) {
            this.combatState.berserkActive = false;
            this.addBattleLog(`🔥 狂暴状态结束了！`);
        }
        
        // 检查生命汲取状态
        if (this.combatState.lifeDrainActive && currentTime >= this.combatState.lifeDrainEndTime) {
            this.combatState.lifeDrainActive = false;
            this.addBattleLog(`🩸 生命汲取效果结束了！`);
        }
        
        // 检查护盾状态
        if (this.combatState.shieldActive && currentTime >= this.combatState.shieldEndTime) {
            this.combatState.shieldActive = false;
            this.character.shield = 0;
            this.addBattleLog(`🛡️ 护盾效果结束了！`);
        }
    }
    
    // 显示伤害数字
    showDamageNumber(damage, type = 'normal') {
        const effectsArea = document.getElementById('effects-area');
        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${type}`;
        
        let displayText = '';
        switch (type) {
            case 'critical':
                displayText = `${damage} 💥`;
                break;
            case 'heal':
                displayText = `+${damage} ❤️`;
                break;
            case 'skill':
                displayText = `${damage} 🔥`;
                break;
            case 'lightning':
                displayText = `${damage} ⚡`;
                break;
            case 'shield':
                displayText = `+${damage} 🛡️`;
                break;
            case 'enemy':
                displayText = `-${damage}`;
                break;
            default:
                displayText = `${damage}`;
        }
        
        damageElement.textContent = displayText;
        damageElement.style.left = Math.random() * 80 + 10 + '%';
        damageElement.style.top = '50%';
        
        effectsArea.appendChild(damageElement);
        
        // 2秒后移除元素
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 2000);
    }
    
    // 显示技能特效
    showSkillEffect(emoji, skillType) {
        const effectsArea = document.getElementById('effects-area');
        const effectElement = document.createElement('div');
        
        // 根据技能类型设置不同的特效样式
        switch (skillType) {
            case 'lightningChain':
                effectElement.className = 'skill-effect-lightning';
                effectElement.textContent = '⚡';
                this.triggerScreenShake();
                break;
            case 'shield':
                effectElement.className = 'skill-effect-shield';
                effectElement.textContent = '🛡️';
                break;
            case 'berserk':
                effectElement.className = 'skill-effect-berserk';
                effectElement.textContent = '🔥';
                this.triggerScreenShake();
                break;
            case 'lifeDrain':
                effectElement.className = 'skill-effect-lifedrain';
                effectElement.textContent = '🩸';
                break;
            default:
                effectElement.className = 'skill-effect';
                effectElement.textContent = emoji;
        }
        
        // 随机位置
        effectElement.style.left = Math.random() * 60 + 20 + '%';
        effectElement.style.top = Math.random() * 40 + 10 + '%';
        
        effectsArea.appendChild(effectElement);
        
        // 1秒后移除元素
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 1000);
    }
    
    // 触发屏幕震动效果
    triggerScreenShake() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('screen-shake');
        
        setTimeout(() => {
            gameContainer.classList.remove('screen-shake');
        }, 500);
    }
    
    // 触发暴击闪光效果
    triggerCriticalFlash() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('critical-flash');
        
        setTimeout(() => {
            gameContainer.classList.remove('critical-flash');
        }, 300);
    }
    
    // 绑定技能升级事件
    bindSkillUpgradeEvents() {
        const skillUpgradeCosts = {
            fireball: 2,
            heal: 2,
            critical: 2,
            lightningChain: 3,
            shield: 3,
            berserk: 4,
            lifeDrain: 4
        };
        
        Object.keys(this.skills).forEach(skillKey => {
            const upgradeBtn = document.getElementById(`upgrade-${skillKey}`);
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    this.upgradeSkill(skillKey, skillUpgradeCosts[skillKey]);
                });
            }
        });
    }
    
    // 升级技能
    upgradeSkill(skillKey, cost) {
        const skill = this.skills[skillKey];
        
        if (!skill) return;
        
        if (this.character.upgradePoints < cost) {
            this.addBattleLog('升级点数不足！需要 ' + cost + ' 点');
            return;
        }
        
        if (skill.level >= skill.maxLevel) {
            this.addBattleLog(skill.name + ' 已达到最高等级！');
            return;
        }
        
        // 执行升级
        skill.level++;
        this.character.upgradePoints -= cost;
        
        // 更新UI
        this.updateUI();
        this.updateSkillUpgradeUI();
        
        // 显示升级信息
        this.addBattleLog(`${skill.name} 升级到 ${skill.level} 级！`);
        
        // 显示升级特效和粒子效果
        this.showSkillEffect('✨', 'upgrade');
        this.createParticleEffect('skill', { x: 250, y: 300 }, 12);
        
        // 检查技能大师成就
        this.checkAchievement('skillMaster');
    }
    
    // 更新技能升级UI
    updateSkillUpgradeUI() {
        Object.keys(this.skills).forEach(skillKey => {
            const skill = this.skills[skillKey];
            const levelSpan = document.getElementById(`${skillKey}-level`);
            const upgradeBtn = document.getElementById(`upgrade-${skillKey}`);
            
            if (levelSpan) {
                levelSpan.textContent = skill.level;
            }
            
            if (upgradeBtn) {
                if (skill.level >= skill.maxLevel) {
                    upgradeBtn.textContent = '已满级';
                    upgradeBtn.disabled = true;
                    upgradeBtn.classList.add('max-level');
                } else {
                    const skillUpgradeCosts = {
                        fireball: 2, heal: 2, critical: 2,
                        lightningChain: 3, shield: 3,
                        berserk: 4, lifeDrain: 4
                    };
                    const cost = skillUpgradeCosts[skillKey];
                    upgradeBtn.textContent = `升级 (${cost}点)`;
                    upgradeBtn.disabled = this.character.upgradePoints < cost;
                    upgradeBtn.classList.remove('max-level');
                }
            }
        });
    }
    
    // 粒子特效系统
    createParticleEffect(type, x, y, count = 10) {
        const effectsArea = document.getElementById('effects-area');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;
            
            // 设置初始位置
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            particle.style.left = (x + offsetX) + 'px';
            particle.style.top = (y + offsetY) + 'px';
            
            // 设置随机动画延迟
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            
            effectsArea.appendChild(particle);
            
            // 动画结束后移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }
    
    // 连击特效
    showComboEffect(comboCount) {
        if (comboCount <= 1) return;
        
        const effectsArea = document.getElementById('effects-area');
        const comboElement = document.createElement('div');
        comboElement.className = 'combo-effect';
        comboElement.textContent = `${comboCount} COMBO!`;
        
        // 根据连击数设置不同的样式
        if (comboCount >= 10) {
            comboElement.classList.add('combo-legendary');
        } else if (comboCount >= 5) {
            comboElement.classList.add('combo-epic');
        } else {
            comboElement.classList.add('combo-normal');
        }
        
        effectsArea.appendChild(comboElement);
        
        // 创建连击粒子特效
        const rect = effectsArea.getBoundingClientRect();
        this.createParticleEffect('combo', rect.width / 2, rect.height / 2, comboCount);
        
        setTimeout(() => {
            if (comboElement.parentNode) {
                comboElement.parentNode.removeChild(comboElement);
            }
        }, 2000);
    }
    
    // 更新技能冷却显示
    updateSkillCooldowns() {
        const currentTime = Date.now();
        
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            const cooldownElement = document.getElementById(`${skillName}-cooldown`);
            const skillButton = document.getElementById(`${skillName}-btn`);
            
            const timeSinceLastUse = currentTime - skill.lastUsed;
            const remainingCooldown = skill.cooldown - timeSinceLastUse;
            
            if (remainingCooldown > 0) {
                const seconds = Math.ceil(remainingCooldown / 1000);
                cooldownElement.textContent = seconds;
                cooldownElement.classList.add('active');
                skillButton.disabled = true;
            } else {
                cooldownElement.textContent = '';
                cooldownElement.classList.remove('active');
                skillButton.disabled = false;
            }
        });
    }
    
    // 触发攻击动画
    triggerAttackAnimation(attacker) {
        const element = attacker === 'hero' ? 
            document.querySelector('.character-avatar') : 
            document.querySelector('.enemy-avatar');
        
        if (element) {
            element.classList.add('attacking');
            setTimeout(() => {
                element.classList.remove('attacking');
            }, 600);
        }
    }
    
    // 触发受击动画
    triggerHitAnimation(target) {
        const element = target === 'hero' ? 
            document.querySelector('.character-avatar') : 
            document.querySelector('.enemy-avatar');
        
        if (element) {
            element.classList.add('hit');
            setTimeout(() => {
                element.classList.remove('hit');
            }, 500);
        }
    }
    
    // 更新连击显示
    updateComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        const comboCountElement = document.getElementById('combo-count');
        const comboProgress = document.getElementById('combo-progress');
        
        if (this.combatState.comboCount > 1) {
            comboDisplay.style.display = 'block';
            comboCountElement.textContent = this.combatState.comboCount;
            
            // 连击进度条（基于连击数量）
            const maxCombo = 10; // 最大连击显示
            const progress = Math.min(this.combatState.comboCount / maxCombo * 100, 100);
            comboProgress.style.width = progress + '%';
            
            // 连击动画
            comboDisplay.style.animation = 'none';
            setTimeout(() => {
                comboDisplay.style.animation = 'combo-pulse 0.5s ease-in-out';
            }, 10);
        } else {
            comboDisplay.style.display = 'none';
        }
    }
    
    // 显示音效提示
    showSoundEffect(emoji) {
        const effectsArea = document.querySelector('.effects-area');
        const soundEffect = document.createElement('div');
        soundEffect.className = 'sound-effect';
        soundEffect.textContent = emoji;
        soundEffect.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2rem;
            z-index: 15;
            animation: sound-effect-bounce 1s ease-out forwards;
            pointer-events: none;
        `;
        
        effectsArea.appendChild(soundEffect);
        
        setTimeout(() => {
            if (soundEffect.parentNode) {
                soundEffect.parentNode.removeChild(soundEffect);
            }
        }, 1000);
    }
    
    // 升级属性
    upgradeAttribute(type) {
        if (this.character.upgradePoints <= 0) return;
        
        this.character.upgradePoints--;
        
        switch (type) {
            case 'hp':
                this.character.maxHp += 20;
                this.character.hp += 20; // 升级时也增加当前血量
                this.addBattleLog('血量上限增加了20点！💪');
                break;
            case 'attack':
                this.character.attack += 5;
                this.addBattleLog('攻击力增加了5点！⚔️');
                break;
        }
        
        this.updateUI();
        this.saveGame();
    }
    
    // 添加战斗日志
    addBattleLog(message) {
        this.battleLogMessages.push(message);
        
        // 限制日志数量
        if (this.battleLogMessages.length > 10) {
            this.battleLogMessages.shift();
        }
        
        this.updateBattleLog();
    }
    
    // 更新战斗日志显示
    updateBattleLog() {
        const logContent = document.getElementById('battle-log-content');
        logContent.innerHTML = this.battleLogMessages
            .map(msg => `<p>${msg}</p>`)
            .join('');
        
        // 滚动到底部
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    // 更新UI
    updateUI() {
        // 更新角色状态
        document.getElementById('character-level').textContent = this.character.level;
        document.getElementById('character-hp').textContent = this.character.hp;
        document.getElementById('character-max-hp').textContent = this.character.maxHp;
        document.getElementById('character-attack').textContent = this.character.attack;
        document.getElementById('character-exp').textContent = this.character.exp;
        document.getElementById('character-max-exp').textContent = this.character.maxExp;
        
        // 更新护盾值显示
        const shieldElement = document.getElementById('character-shield');
        const shieldStatus = document.getElementById('shield-status');
        if (shieldElement && shieldStatus) {
            shieldElement.textContent = this.character.shield || 0;
            shieldStatus.style.display = this.character.shield > 0 ? 'block' : 'none';
        }
        
        // 更新经验条
        const expPercentage = (this.character.exp / this.character.maxExp) * 100;
        document.getElementById('exp-bar-fill').style.width = `${expPercentage}%`;
        
        // 更新角色血量条
        const characterHpPercentage = (this.character.hp / this.character.maxHp) * 100;
        document.getElementById('character-hp-bar-fill').style.width = `${characterHpPercentage}%`;
        
        // 更新敌人信息
        if (this.currentEnemy) {
            document.getElementById('enemy-name').textContent = this.currentEnemy.name;
            document.getElementById('enemy-hp').textContent = Math.max(0, this.currentEnemy.hp);
            document.getElementById('enemy-max-hp').textContent = this.currentEnemy.maxHp;
            
            // 更新敌人头像
            document.getElementById('enemy-avatar').textContent = this.currentEnemy.emoji;
            
            // 更新敌人血量条
            const enemyHpPercentage = Math.max(0, (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100);
            document.getElementById('enemy-hp-bar-fill').style.width = `${enemyHpPercentage}%`;
        }
        
        // 更新升级点数
        document.getElementById('upgrade-points').textContent = this.character.upgradePoints;
        
        // 更新升级按钮状态
        const upgradeHpBtn = document.getElementById('upgrade-hp-btn');
        const upgradeAttackBtn = document.getElementById('upgrade-attack-btn');
        
        const hasUpgradePoints = this.character.upgradePoints > 0;
        upgradeHpBtn.disabled = !hasUpgradePoints;
        upgradeAttackBtn.disabled = !hasUpgradePoints;
        
        // 更新技能升级UI
        this.updateSkillUpgradeUI();
        
        // 更新技能冷却时间
        this.updateSkillCooldowns();
    }
    
    // 绑定事件
    bindEvents() {
        // 升级按钮
        document.getElementById('upgrade-hp-btn').addEventListener('click', () => {
            this.upgradeAttribute('hp');
        });
        
        document.getElementById('upgrade-attack-btn').addEventListener('click', () => {
            this.upgradeAttribute('attack');
        });
        
        // 绑定技能升级按钮事件
        this.bindSkillUpgradeEvents();
        
        // 技能按钮
        document.getElementById('fireball-btn').addEventListener('click', () => {
            this.useSkill('fireball');
        });
        
        document.getElementById('heal-btn').addEventListener('click', () => {
            this.useSkill('heal');
        });
        
        document.getElementById('critical-btn').addEventListener('click', () => {
            this.useSkill('critical');
        });
        
        // 新技能按钮
        document.getElementById('lightning-chain-btn').addEventListener('click', () => {
            this.useSkill('lightningChain');
        });
        
        document.getElementById('shield-btn').addEventListener('click', () => {
            this.useSkill('shield');
        });
        
        document.getElementById('berserk-btn').addEventListener('click', () => {
            this.useSkill('berserk');
        });
        
        document.getElementById('life-drain-btn').addEventListener('click', () => {
            this.useSkill('lifeDrain');
        });
        
        // 保存游戏按钮
        document.getElementById('save-game-btn').addEventListener('click', () => {
            this.saveGame();
            this.addBattleLog('游戏已保存！💾');
        });
        
        // 重置游戏按钮
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
                this.resetGame();
            }
        });
    }
    
    // 开始游戏循环
    startGameLoop() {
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
        }
        
        if (this.skillUpdateId) {
            clearInterval(this.skillUpdateId);
        }
        
        this.gameLoopId = setInterval(() => {
            this.battle();
            this.updateUI();
        }, 1000); // 每秒执行一次战斗
        
        // 技能冷却更新循环（每100毫秒更新一次，更流畅）
        this.skillUpdateId = setInterval(() => {
            this.updateSkillCooldowns();
        }, 100);
    }
    
    // 停止游戏循环
    stopGameLoop() {
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        if (this.skillUpdateId) {
            clearInterval(this.skillUpdateId);
            this.skillUpdateId = null;
        }
    }
    
    // 保存游戏
    saveGame() {
        const gameData = {
            character: this.character,
            battleLogMessages: this.battleLogMessages
        };
        
        localStorage.setItem('idleARPGSave', JSON.stringify(gameData));
    }
    
    // 加载游戏
    loadGame() {
        const savedData = localStorage.getItem('idleARPGSave');
        
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                
                // 恢复角色数据
                if (gameData.character) {
                    this.character = { ...this.character, ...gameData.character };
                }
                
                // 恢复战斗日志
                if (gameData.battleLogMessages) {
                    this.battleLogMessages = gameData.battleLogMessages;
                }
                
                this.addBattleLog('游戏数据已加载！');
            } catch (error) {
                console.error('加载游戏数据失败:', error);
                this.addBattleLog('加载游戏数据失败，开始新游戏。');
            }
        }
    }
    
    // 重置游戏
    resetGame() {
        // 停止游戏循环
        this.stopGameLoop();
        
        // 重置数据
        this.character = {
            level: 1,
            hp: 100,
            maxHp: 100,
            attack: 10,
            exp: 0,
            maxExp: 100,
            upgradePoints: 0
        };
        
        this.battleLogMessages = [];
        
        // 清除保存数据
        localStorage.removeItem('idleARPGSave');
        
        // 重新初始化
        this.generateEnemy();
        this.updateUI();
        this.addBattleLog('游戏已重置！');
        
        // 重新开始游戏循环
        this.startGameLoop();
    }
    
    // 敌人攻击方法
    enemyAttack() {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;
        
        let enemyDamage = this.currentEnemy.attack + Math.floor(Math.random() * 5);
        
        // BOSS技能使用逻辑
        if (this.currentEnemy.isBoss && this.currentEnemy.skills && this.currentEnemy.skills.length > 0) {
            const useSkill = Math.random() < 0.3; // 30%概率使用技能
            
            if (useSkill) {
                const skillName = this.currentEnemy.skills[Math.floor(Math.random() * this.currentEnemy.skills.length)];
                this.useBossSkill(skillName);
                return;
            }
        }
        
        // 护盾吸收伤害
        if (this.character.shield > 0) {
            const shieldAbsorb = Math.min(enemyDamage, this.character.shield);
            this.character.shield -= shieldAbsorb;
            enemyDamage -= shieldAbsorb;
            
            if (shieldAbsorb > 0) {
                this.addBattleLog(`🛡️ 护盾吸收了 ${shieldAbsorb} 点伤害！`);
                this.showDamageNumber(shieldAbsorb, 'shield');
            }
            
            if (this.character.shield <= 0) {
                this.addBattleLog(`🛡️ 护盾被击破了！`);
                this.combatState.shieldActive = false;
            }
        }
        
        // 剩余伤害作用于生命值
        if (enemyDamage > 0) {
            this.character.hp -= enemyDamage;
        }
        
        // 触发攻击动画
        this.triggerAttackAnimation('enemy');
        this.triggerHitAnimation('hero');
        
        if (enemyDamage > 0) {
            this.addBattleLog(`${this.currentEnemy.name} 攻击勇者，造成 ${enemyDamage} 点伤害！`);
            this.showDamageNumber(enemyDamage, 'enemy');
        } else {
            this.addBattleLog(`${this.currentEnemy.name} 的攻击被完全吸收了！`);
        }
    }
    
    // BOSS技能使用
    useBossSkill(skillName) {
        switch (skillName) {
            case 'fireball':
                const fireballDamage = 25 + Math.floor(Math.random() * 15);
                this.character.hp -= fireballDamage;
                this.addBattleLog(`🔥 ${this.currentEnemy.name} 释放火球术，造成 ${fireballDamage} 点火焰伤害！`);
                this.showDamageNumber(fireballDamage, 'enemy');
                this.createParticleEffect('skill', { x: 150, y: 200 }, 8);
                break;
                
            case 'heal':
                const healAmount = 30 + Math.floor(Math.random() * 20);
                const actualHeal = Math.min(healAmount, this.currentEnemy.maxHp - this.currentEnemy.hp);
                this.currentEnemy.hp += actualHeal;
                this.addBattleLog(`💚 ${this.currentEnemy.name} 使用治疗术，恢复了 ${actualHeal} 点生命值！`);
                this.showDamageNumber(actualHeal, 'heal');
                break;
                
            case 'lightningChain':
                const lightningDamage = 20 + Math.floor(Math.random() * 10);
                this.character.hp -= lightningDamage;
                this.addBattleLog(`⚡ ${this.currentEnemy.name} 释放闪电链，造成 ${lightningDamage} 点雷电伤害！`);
                this.showDamageNumber(lightningDamage, 'enemy');
                this.createParticleEffect('skill', { x: 150, y: 200 }, 10);
                this.triggerScreenShake();
                break;
                
            case 'berserk':
                this.addBattleLog(`😡 ${this.currentEnemy.name} 进入狂暴状态，攻击力大幅提升！`);
                this.currentEnemy.attack = Math.floor(this.currentEnemy.attack * 1.5);
                break;
        }
        
        this.triggerAttackAnimation('enemy');
        this.triggerHitAnimation('hero');
    }
    
    // 检查成就
    checkAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;
        
        let shouldUnlock = false;
        
        switch (achievementId) {
            case 'firstKill':
                shouldUnlock = true;
                break;
                
            case 'levelUp':
                shouldUnlock = this.character.level >= 5;
                break;
                
            case 'skillMaster':
                const maxLevelSkills = Object.values(this.skills).filter(skill => skill.level >= skill.maxLevel);
                shouldUnlock = maxLevelSkills.length >= 3;
                break;
                
            case 'bossSlayer':
                shouldUnlock = this.bossState.bossDefeatedCount >= 1;
                break;
                
            case 'legendary':
                shouldUnlock = this.character.level >= 20 && this.bossState.bossDefeatedCount >= 3;
                break;
        }
        
        if (shouldUnlock) {
            achievement.unlocked = true;
            this.addBattleLog(`🏆 成就解锁：${achievement.name} - ${achievement.description}`);
            this.addBattleLog(`🎁 获得奖励：${achievement.reward}`);
            
            // 应用奖励
            this.character.upgradePoints += 2;
            
            // 成就解锁特效
            this.triggerScreenShake();
            this.createParticleEffect('critical', { x: 250, y: 100 }, 15);
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameState();
    
    // 页面关闭前自动保存
    window.addEventListener('beforeunload', () => {
        if (window.game) {
            window.game.saveGame();
        }
    });
});