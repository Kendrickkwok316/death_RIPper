import { init, initPointer, onPointer, getPointer, Button, setImagePath, imageAssets, GameObjectClass, collides, Sprite, Text, SpriteClass, GameLoop, load, SpriteSheet } from "../node_modules/kontra/kontra.mjs"
import CPlayer from "./player-small.js";
import { BGM, BREAK, HIT } from "../assets/compressed.js";

function randInt(max) {
    return Math.floor(Math.random() * max);
}

function weightRand(spec) {
    let i, sum = 0, r = Math.random();
    for (i in spec) {
        sum += spec[i];
        if (r <= sum) return i;
    }
}

init();
initPointer();
setImagePath('assets/img/');
let restart = false;
let scene = 0;
let bgmPlayer = new CPlayer();
let breakPlayer = new CPlayer();
let hitPlayer = new CPlayer();
bgmPlayer.init(BGM);
breakPlayer.init(BREAK);
hitPlayer.init(HIT);
let bgmWave;
let breakWave;
let hitWave;
let bgmAudio = document.createElement("audio");
let breakAudio = document.createElement("audio");
let hitAudio = document.createElement("audio");
let bgmReady = false;
let breakReady = false;
let hitReady = false;
let sHistory = parseInt(localStorage.getItem('dsShieldHistory')) ? parseInt(localStorage.getItem('dsShieldHistory')) : 0;
let highScore = parseInt(localStorage.getItem('dsHighScore')) ? parseInt(localStorage.getItem('dsHighScore')) : 0;
let preBGM = setInterval(function () {
    if (bgmReady) {
        console.log('BGM ready');
        bgmWave = bgmPlayer.createWave();
        bgmAudio.src = URL.createObjectURL(new Blob([bgmWave], { type: "audio/wav" }));
        bgmAudio.loop = true;
        clearInterval(preBGM);
    }
    bgmReady = bgmPlayer.generate() >= 1;
})
let preBREAK = setInterval(function () {
    if (breakReady) {
        breakWave = breakPlayer.createWave();
        breakAudio.src = URL.createObjectURL(new Blob([breakWave], { type: "audio/wav" }));
        clearInterval(preBREAK);
    }
    breakReady = breakPlayer.generate() >= 1;
})
let preHIT = setInterval(function () {
    if (hitReady) {
        hitWave = hitPlayer.createWave();
        hitAudio.src = URL.createObjectURL(new Blob([hitWave], { type: "audio/wav" }));
        clearInterval(preHIT);
    }
    hitReady = hitPlayer.generate() >= 1;
})
let topic = Text({
    text: 'Death RIPper',
    font: '36px Aerial',
    color: 'white',
    x: 320,
    y: 30,
    anchor: { x: 0.5, y: 0.5 },
    textAlign: 'center'
});

let tutorial = Text({
    text: 'The job of death is boring yet vital. If they did not banish the decreased from earth,\n they will turn into spectres and harm the world. ' +
    'Your time is limited.\nSend those poor souls to hell while avoiding spectres.\n' + 
    'The peace of the world is upon you.\n\n\n\n' + 
    'When the human is dying, a counter will appear over them. \nWhen the counter turns to 0, they will turn into spectres.\n\n'+
    'Approach them before the counter runs out. You cannot lay hands on the livings.\n\n'+
    'Click on the Map to move. You will stop once bump into anything except the dyings.\n\n'+
    'If you are hit by spectres, a shield will be broken and\nyou will be sent back to hell if you are hit by spectres without any shield.\n\n'+
    'You will also be sent back to hell if your time on earth runs out.\nCollect more souls from the dyings to extend your time.',
    font: '15px Aerial',
    color: 'white',
    x: 320,
    y: 100,
    anchor: { x: 0.5, y: 0 },
    textAlign: 'center'
});

let startButton = Button({
    // sprite properties
    x: 320,
    y: 500,
    anchor: { x: 0.5, y: 0.5 },

    // text properties
    text: {
        text: 'Start Game',
        color: 'white',
        font: '24px sans-serif',
        anchor: { x: 0.5, y: 0.5 }
    },

    // button properties
    padX: 20,
    padY: 10,

    render() {
        // focused by keyboard
        if (this.focused) {
            this.context.setLineDash([8, 10]);
            this.context.lineWidth = 3;
            this.context.strokeStyle = 'red';
            this.context.strokeRect(0, 0, this.width, this.height);
        }

        // pressed by mouse, touch, or enter/space on keyboard
        if (this.pressed) {
            this.textNode.color = 'yellow';
            bgmAudio.play();
            genMap();
            console.log('SAS');
            scene = 1;
            this.pressed = false;
        }
        // hovered by mouse
        else if (this.hovered) {
            this.textNode.color = 'red';
        }
        else {
            this.textNode.color = 'white';
        }
    }
});

//ghost, spectre

let endGameTxt = Button({
    x: 300,
    y: 150,
    anchor: { x: 0.5, y: 0.5 },
    text: {
        text: 'You are sent back to hell',
        color: 'red',
        font: '30px sans-serif',
        anchor: { x: 0.5, y: 0.5 }
    },
    padX: 20,
    padY: 10
});

let score = Text({
    text: '',
    font: '18px Aerial',
    color: 'white',
    x: 300,
    y: 250,
    anchor: { x: 0.5, y: 0.5 },
    textAlign: 'center'
});

let titleBut = Button({
    x: 300,
    y: 350,
    anchor: { x: 0.5, y: 0.5 },
    padX: 10,
    padY: 10,
    onDown() {
        scene = 0;
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
        console.log('RE');
    }
});

load('replayBut.png').then(() => {
    titleBut.image = imageAssets['replayBut'];
});

let timeBar = Sprite({
    x: 5,
    y: 5,
    anchor: { x: 0, y: 0 },
    height: 20,
    width: 300,
    color: 'Aqua'
});
let timeCounter = 0;
let shields = [];
load('shield.png').then(() => {
    for (let i = 0; i < 6; i++) {
        let shield = Sprite({
            x: 5 + i * 20,
            y: 30,
            anchor: { x: 0, y: 0 },
            height: 15,
            width: 15,
            image: imageAssets['shield']
        });
        shields.push(shield);
    }
});

let backGround = Sprite({
    x: 0,
    y: 50,
    anchor: { x: 0, y: 0 },
    height: 480,
    width: 640
});
load('ground.png').then(() => {
    backGround.image = imageAssets['ground'];
});
load('tree.png').then(() => { });
let playerSprite;
let playerImage = new Image();
playerImage.src = 'assets/img/death.png';
playerImage.onload = function () {
    playerSprite = SpriteSheet({
        image: playerImage,
        frameWidth: 20,
        frameHeight: 20,
        animations: {
            strike: {
                frames: '0..2',
                frameRate: 9
            }
        }
    });
    sprite = new Player({
        x: 400,
        y: 320,
        width: 20,
        height: 20,
        anchor: { x: 0.5, y: 0.5 },
        shield: Math.floor(sHistory / 20) + 1,
        point: 0,
        animations: playerSprite.animations
    })
};
let humanSprite;
let humanImage = new Image();
humanImage.src = 'assets/img/human.png';
humanImage.onload = function () {
    humanSprite = SpriteSheet({
        image: humanImage,
        frameWidth: 20,
        frameHeight: 20,
        animations: {
            die: {
                frames: '0..2',
                frameRate: 60
            }
        }
    });
};
class bound extends GameObjectClass {
    constructor(properties) {
        properties.anchor = { x: 0, y: 0 };
        properties.color = '#CD853F';
        super(properties);
    }
    draw() {
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.width, this.height);
    }
}

let bounds = [];
let bPara = [[0, 50, 10, 295], [0, 50, 215, 10], [0, 520, 10, 295], [0, 315, 215, 10], [345, 50, 10, 295], [630, 50, 215, 10], [345, 520, 10, 295], [630, 315, 215, 10]];
bPara.forEach(paras => {
    bounds.push(new bound({
        x: paras[0],
        y: paras[1],
        height: paras[2],
        width: paras[3],
    }));
});

class exit extends GameObjectClass {
    constructor(properties) {
        super(properties);
    }
}
let exits = [];
let ePara = [[295, 50, 10, 50, 320, 490], [0, 265, 50, 10, 600, 290], [295, 520, 10, 50, 320, 90], [630, 265, 50, 10, 40, 290]];
ePara.forEach(paras => {
    exits.push(new exit({
        x: paras[0],
        y: paras[1],
        height: paras[2],
        width: paras[3],
        anchor: { x: 0, y: 0 },
        sx: paras[4],
        sy: paras[5]
    }));
});

class Player extends SpriteClass {
    constructor(properties) {
        super(properties);
    }

    draw() {
        super.draw();
    }
}

let sprite;

let navi;
load('pointer.png').then(() => {
    navi = new Player({
        x: 400,
        y: 320,
        width: 10,
        height: 10,
        anchor: { x: 0.5, y: 0.5 },
        image: imageAssets['pointer']
    });
});

class Wall extends GameObjectClass {
    constructor(properties) {
        super(properties);
        let wallType = randInt(3);
        switch (wallType) {
            case 0:
                let topLeft = { x: - properties.width / 2, y: - properties.height / 2 };
                let topRight = { x: properties.width / 2 - 25, y: - properties.height / 2 };
                let bottomLeft = { x: - properties.width / 2, y: properties.height / 2 - 25 };
                let pPt1 = null;
                let pPt2 = null;
                let ori = randInt(4);
                switch (ori) {
                    case 0:
                        pPt1 = topLeft;
                        pPt2 = bottomLeft;
                        break;
                    case 1:
                        pPt1 = topRight;
                        pPt2 = bottomLeft;
                        break
                    case 2:
                        pPt1 = topRight;
                        pPt2 = topLeft;
                        break
                    case 3:
                        pPt1 = topLeft;
                        pPt2 = topLeft;
                        break
                    default:
                        console.log('Some error occurred');
                }
                for (let i = 0; i < 5; i++) {
                    let wallChild = Sprite({
                        x: pPt1.x,
                        y: pPt1.y + i * 25,
                        width: 25,
                        height: 25,
                        anchor: { x: 0, y: 0 },
                        image: imageAssets['tree']
                    });
                    this.addChild(wallChild);
                }
                for (let i = 0; i < 5; i++) {
                    let wallChild = Sprite({
                        x: pPt2.x + i * 25,
                        y: pPt2.y,
                        width: 25,
                        height: 25,
                        anchor: { x: 0, y: 0 },
                        image: imageAssets['tree']
                    });
                    this.addChild(wallChild);
                }
                let topL = { x: properties.x - properties.width / 2, y: properties.y - properties.height / 2 };
                let topR = { x: properties.x + properties.width / 2, y: properties.y - properties.height / 2 };
                let bottomL = { x: properties.x - properties.width / 2, y: properties.y + properties.height / 2 };
                let bottomR = { x: properties.x + properties.width / 2, y: properties.y + properties.height / 2 };
                switch (ori) {
                    case 0:
                        this.lines = [{ pt1: topL, pt2: bottomL }, { pt1: bottomL, pt2: bottomR }];
                        break;
                    case 1:
                        this.lines = [{ pt1: topR, pt2: bottomR }, { pt1: bottomL, pt2: bottomR }];
                        break
                    case 2:
                        this.lines = [{ pt1: topL, pt2: topR }, { pt1: topR, pt2: bottomR }];
                        break
                    case 3:
                        this.lines = [{ pt1: topL, pt2: bottomL }, { pt1: topL, pt2: topR }];
                        break
                    default:
                        console.log('Some error occurred');
                }
                break;
            case 1:
                let left = { x: - properties.width / 2, y: - 25 / 2 };
                let top = { x: - 25 / 2, y: - properties.width / 2 };
                for (let i = 0; i < 5; i++) {
                    let wallChild = Sprite({
                        x: left.x + i * 25,
                        y: left.y,
                        width: 25,
                        height: 25,
                        anchor: { x: 0, y: 0 },
                        image: imageAssets['tree']
                    });
                    this.addChild(wallChild);
                }
                for (let i = 0; i < 5; i++) {
                    let wallChild = Sprite({
                        x: top.x,
                        y: top.y + i * 25,
                        width: 25,
                        height: 25,
                        anchor: { x: 0, y: 0 },
                        image: imageAssets['tree']
                    });
                    this.addChild(wallChild);
                }
                let lTop = { x: properties.x, y: properties.y - properties.height / 2 };
                let lBottom = { x: properties.x, y: properties.y + properties.height / 2 };
                let lLeft = { x: properties.x - properties.width / 2, y: properties.y };
                let lRight = { x: properties.x + properties.width / 2, y: properties.y };
                this.lines = [{ pt1: lTop, pt2: lBottom }, { pt1: lLeft, pt2: lRight }];
                break;
            case 2:
                let lOri = randInt(2);
                let slot = randInt(5);
                switch (lOri) {
                    case 0:
                        for (let i = 0; i < 5; i++) {
                            let wallChild = Sprite({
                                x: -properties.width / 2 + i * 25,
                                y: (slot - 2) * 25 - 25 / 2,
                                width: 25,
                                height: 25,
                                anchor: { x: 0, y: 0 },
                                image: imageAssets['tree']
                            });
                            this.addChild(wallChild);
                        }
                        let pt1 = { x: properties.x - properties.width / 2, y: properties.y + (slot - 2) * 25 };
                        let pt2 = { x: properties.x + properties.width / 2, y: properties.y + (slot - 2) * 25 };
                        this.lines = [{ pt1: pt1, pt2: pt2 }];
                        break;
                    case 1:
                        for (let i = 0; i < 5; i++) {
                            let wallChild = Sprite({
                                x: (slot - 2) * 25 - 25 / 2,
                                y: -properties.height / 2 + i * 25,
                                width: 25,
                                height: 25,
                                anchor: { x: 0, y: 0 },
                                image: imageAssets['tree']
                            });
                            this.addChild(wallChild);
                        }
                        let lPt1 = { x: properties.x + (slot - 2) * 25, y: properties.y - properties.height / 2 };
                        let lPt2 = { x: properties.x + (slot - 2) * 25, y: properties.y + properties.height / 2 };
                        this.lines = [{ pt1: lPt1, pt2: lPt2 }];
                        break;
                    default:
                        console.log('Some line error occurred');
                }
                break;
            default:
                console.log('Some type error occurred');
        }
    }

    cast(pt1, pt2) {
        for (let line of this.lines) {
            let x1 = line.pt1.x;
            let y1 = line.pt1.y;
            let x2 = line.pt2.x;
            let y2 = line.pt2.y;
            let x3 = pt1.x;
            let y3 = pt1.y;
            let x4 = pt2.x;
            let y4 = pt2.y;
            let deno = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (deno == 0) {
                continue;
            }
            let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / deno;
            let u = - ((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / deno;
            if (t > 0 && t < 1 && u > 0) {
                return true;
            } else {
                continue;
            }
        }
        return false;
    }
}

class Human extends SpriteClass {
    constructor(properties) {
        super(properties);
        this.lifeCount = (10 + randInt(5)) * 60;
        this.state = 3;
        this.repelX = 0;
        this.repelY = 0;
        this.lCounter = Text({
            text: '',
            font: '18px Aerial',
            color: 'white',
            x: 0,
            y: 0,
            anchor: { x: 0.5, y: 0.5 },
            textAlign: 'center'
        });
    }

    check() {
        let rCasted = false;
        for (let wallGroup of wallGroups) {
            if (wallGroup.cast(this, sprite) && wallGroup.cast(sprite, this)) {
                rCasted = true;
                break;
            }
        }
        if (!rCasted) {
            let [moveX, moveY] = interPolation(this, sprite, 1);
            let xWallCol = false;
            for (let wallGroup of wallGroups) {
                this.x -= moveX;
                if (collides(this, wallGroup)) {
                    for (let wall of wallGroup.children) {
                        if (collides(this, wall)) {
                            //console.log('Hit x');
                            this.x += moveX;
                            xWallCol = true;
                            break;
                        }
                    }
                } else {
                    this.x += moveX;
                }
            }
            let yWallCol = false;
            for (let wallGroup of wallGroups) {
                this.y -= moveY;
                if (collides(this, wallGroup)) {
                    for (let wall of wallGroup.children) {
                        if (collides(this, wall)) {
                            //console.log('Hit y');
                            this.y += moveY;
                            yWallCol = true;
                            break;
                        }
                    }
                } else {
                    this.y += moveY;
                }
            }
            for (let bound of bounds) {
                this.x -= moveX;
                if (collides(this, bound)) {
                    this.x += moveX;
                    xWallCol = true;
                    break;
                } else {
                    this.x += moveX;
                }
            }
            for (let bound of bounds) {
                this.y -= moveY;
                if (collides(this, bound)) {
                    this.y += moveY;
                    yWallCol = true;
                    break;
                } else {
                    this.y += moveY;
                }
            }
            for (let exit of exits) {
                this.x -= moveX;
                if (collides(this, exit)) {
                    this.x += moveX;
                    xWallCol = true;
                    break;
                } else {
                    this.x += moveX;
                }
            }
            for (let exit of exits) {
                this.y -= moveY;
                if (collides(this, exit)) {
                    this.y += moveY;
                    yWallCol = true;
                    break;
                } else {
                    this.y += moveY;
                }
            }
            for (let p of preys) {
                if (p.indx == this.indx) {
                    continue;
                }
                this.x -= moveX;
                if (collides(this, p) && p.state != 0) {
                    this.x += moveX;
                    xWallCol = true;
                    break;
                } else {
                    this.x += moveX;
                }
            }
            for (let p of preys) {
                if (p.indx == this.indx) {
                    continue;
                }
                this.y -= moveY;
                if (collides(this, p) && p.state != 0) {
                    this.y += moveY;
                    yWallCol = true;
                    break;
                } else {
                    this.y += moveY;
                }
            }
            if (!xWallCol) {
                //console.log('moveX', moveX);
                this.x -= moveX;
            }
            if (!yWallCol) {
                //console.log('moveY', moveY);
                this.y -= moveY;
            }
        }
    }

    stateChange() {
        if (Math.floor(this.lifeCount / 60) < 11) {
            if (Math.floor(this.lifeCount / 60) < 1) {
                //this.color = 'orange';
                if (this.state == 1) {
                    this.update();
                }
                this.state = 0;
            } else {
                if (Math.floor(this.lifeCount / 60) < 6) {
                    if (this.state == 2) {
                        this.update();
                        this.state = 1;
                    }
                    //this.color = 'purple';
                } else {
                    this.state = 2;
                    //this.color = 'brown';
                }
            }
            return true;
        }
    }

    chase() {
        if (this.repelX || this.repelY) {
            let target = { 'x': this.repelX, 'y': this.repelY };
            let [moveX, moveY] = interPolation(this, target, 2);
            if (this.x != this.repelX || this.y != this.repelY) {
                this.x += moveX;
                this.y += moveY;
            } else {
                this.repelX = 0;
                this.repelY = 0;
            }
        } else {
            let target = { 'x': sprite.x, 'y': sprite.y };
            let [moveX, moveY] = interPolation(this, target, 2);
            if (this.x != target.x || this.y != target.y) {
                this.x += moveX;
                this.y += moveY;
            }
            if (collides(this, sprite)) {
                if (sprite.shield) {
                    breakAudio.play();
                    this.repelX = this.x - moveX * 40;
                    this.repelY = this.y - moveY * 40;
                    sprite.shield -= 1;
                    if (sprite.shield == 0) {
                        sprite.opacity = 0.4;
                    }
                } else {
                    restart = true;
                    console.log('Loser');
                }
            }
        }
    }

    draw() {
        super.draw();
    }
}

let wGSP = [[100, 150], [115, 440], [335, 165], [320, 390], [540, 140], [515, 350]];
let wallGroups = [];
let preys = [];
function genMap() {
    wallGroups.length = 0;
    preys.length = 0;
    wGSP.forEach(pts => {
        wallGroups.push(new Wall({
            x: pts[0],
            y: pts[1],
            width: 125,
            height: 125,
            anchor: { x: 0.5, y: 0.5 }
        }));
    });
    let pAn = { x: 0, y: 0 };
    let genCount = 0;
    while (genCount < 5) {
        let pos = { x: 0, y: 0 };
        let gen = true;
        if (pAn.x <= 320) {
            let interval = Math.floor((620 - pAn.x) / 4);
            pos.x = pAn.x + weightRand({ 4: 0.4, 3: 0.3, 2: 0.2, 1: 0.1 }) * interval - randInt(interval);
        } else {
            let interval = Math.floor((pAn.x - 20) / 4);
            pos.x = pAn.x - weightRand({ 4: 0.4, 3: 0.3, 2: 0.2, 1: 0.1 }) * interval + randInt(interval);
        }
        if (pAn.y <= 265) {
            let interval = Math.floor((460 - pAn.y) / 4);
            pos.y = pAn.y + weightRand({ 4: 0.4, 3: 0.3, 2: 0.2, 1: 0.1 }) * interval - randInt(interval);
        } else {
            let interval = Math.floor((pAn.y - 20) / 4);
            pos.y = pAn.y - weightRand({ 4: 0.4, 3: 0.3, 2: 0.2, 1: 0.1 }) * interval + randInt(interval);
        }
        pAn.x *= genCount;
        pAn.y *= genCount;
        pAn.x += pos.x;
        pAn.y += pos.y;
        pAn.x /= (genCount + 1);
        pAn.y /= (genCount + 1);
        let prey = new Human({
            x: pos.x,
            y: pos.y + 50,
            width: 20,
            height: 20,
            //color: 'blue',
            anchor: { x: 0.5, y: 0.5 },
            indx: genCount,
            animations: humanSprite.animations
        });
        if (collides(prey, sprite)) {
            gen = false;
        }
        if (gen) {
            for (let wallGroup of wallGroups) {
                if (collides(prey, wallGroup)) {
                    for (let wall of wallGroup.children) {
                        if (collides(prey, wall)) {
                            gen = false;
                            break;
                        }
                    }
                }
            }
        }
        if (gen) {
            for (let bound of bounds) {
                if (collides(prey, bound)) {
                    gen = false;
                    break;
                }
            }
        }
        if (gen) {
            for (let exit of exits) {
                if (collides(prey, exit)) {
                    gen = false;
                    break;
                }
            }
        }
        if (gen) {
            preys.push(prey);
            genCount += 1;
            console.log(pAn.x, pAn.y);
            console.log(prey.x, prey.y);
        }
    }
}

function interPolation(obj, targetPosition, speed) {
    let deltaY = targetPosition.y - obj.y;
    if (deltaY > 0) {
        deltaY = deltaY >= speed ? speed : deltaY;
    } else if (deltaY < 0) {
        deltaY = deltaY <= speed ? -speed : deltaY;
    }
    let deltaX = targetPosition.x - obj.x;
    if (deltaX > 0) {
        deltaX = deltaX >= speed ? speed : deltaX;
    } else if (deltaX < 0) {
        deltaX = deltaX <= speed ? -speed : deltaX;
    }
    return [Math.floor(deltaX), Math.floor(deltaY)];
}

let desX = 0;
let desY = 0;

let goFlag = false;
onPointer('down', function (e, object) {
    if (scene == 1) {
        goFlag = true;
        desX = pointer.x;
        desY = pointer.y;
        navi.x = desX;
        navi.y = desY;
    }
});

let hitPrey = 0;
let pointer = getPointer();
let loop = GameLoop({
    update: function () {
        if (goFlag) {
            let target = { 'x': desX, 'y': desY };
            let [moveX, moveY] = interPolation(sprite, target, 3);
            let collided = false;
            if (sprite.x != target.x || sprite.y != target.y) {
                sprite.x += moveX;
                sprite.y += moveY;
            }
            else {
                goFlag = false;
            }
            for (let wallGroup of wallGroups) {
                if (collides(sprite, wallGroup)) {
                    for (let wall of wallGroup.children) {
                        if (collides(sprite, wall)) {
                            collided = true;
                            break;
                        }
                    }
                }
            }
            for (let bound of bounds) {
                if (collides(sprite, bound)) {
                    collided = true;
                    break;
                }
            }
            for (let i = preys.length - 1; i >= 0; i--) {
                if (collides(sprite, preys[i])) {
                    if (preys[i].stateChange()) {
                        if (preys[i].state) {
                            hitAudio.play();
                            sprite.point += 1;
                            if (sprite.point % 5 == 0) {
                                timeBar.width += 200;
                                timeBar.width = timeBar.width > 600 ? 600 : timeBar.width;
                            }
                            preys.splice(i, 1);
                            hitPrey = 20;
                        }
                    } else {
                        collided = true;
                    }
                }
            }
            if (restart) {
                scene = 2;
                preys.length = 0;
                sprite.x = 400;
                sprite.y = 320;
                if (sHistory < 100 || !sHistory) {
                    if ((sHistory + sprite.point) < 100) {
                        if (Math.floor((sHistory + sprite.point) / 20) - Math.floor((sHistory) / 20)) {
                            console.log('New shield');
                        }
                        sHistory = sHistory + sprite.point;
                    } else {
                        console.log('New shield');
                        sHistory = 100;
                    }
                    localStorage.setItem("dsShieldHistory", sHistory);
                }
                sprite.shield = Math.floor(sHistory / 20) + 1;
                sprite.opacity = 1;
                score.text = "Score: " + String(sprite.point);
                if (sprite.point > highScore || !highScore) {
                    console.log("New High Score");
                    score.text += "   New High Score!"
                    highScore = sprite.point;
                    localStorage.setItem("dsHighScore", sprite.point);
                }
                sprite.point = 0;
                timeBar.width = 300;
                timeCounter = 0;
                restart = false;
                goFlag = false;
            }
            for (let exit of exits) {
                if (collides(sprite, exit)) {
                    console.log('Exited');
                    sprite.x = exit.sx;
                    sprite.y = exit.sy;
                    goFlag = false;
                    genMap();
                    break;
                }
            }
            if (collided) {
                goFlag = false;
                sprite.x -= moveX;
                sprite.y -= moveY;
            }
        }
        if (hitPrey) {
            sprite.update();
            hitPrey -= 1;
        }
        for (let i = preys.length - 1; i >= 0; i--) {
            if (preys[i].stateChange()) {
                if (preys[i].state) {
                    preys[i].check();
                } else {
                    preys[i].chase();
                }
            }
            if (preys[i].lifeCount > 0) {
                preys[i].lifeCount -= 1;
            }
        }
    },
    render: function () {
        switch (scene) {
            case 0:
                topic.render();
                tutorial.render();
                startButton.render();
                break
            case 1:
                backGround.render();
                if (timeCounter <= 2) {
                    timeCounter++;
                } else {
                    timeCounter = 0;
                    if (timeBar.width > 0) {
                        timeBar.width -= 1;
                    } else {
                        restart = true;
                    }
                }
                timeBar.render();
                for (let i = 1; i <= sprite.shield; i++) {
                    shields[i - 1].render();
                }
                for (let bound of bounds) {
                    bound.render();
                }
                for (let wallGroup of wallGroups) {
                    wallGroup.render();
                }
                for (let prey of preys) {
                    prey.render();
                    if (prey.state < 3) {
                        prey.lCounter.x = prey.x + 15;
                        prey.lCounter.y = prey.y - 15;
                        prey.lCounter.text = Math.floor(prey.lifeCount / 60);
                        prey.lCounter.render();
                    }
                }
                if (goFlag) {
                    navi.render();
                }
                sprite.render();
                break
            case 2:
                endGameTxt.render();
                titleBut.render();
                score.render();
                break
            default:
                console.log('Error');
        }
    }
})

loop.start();