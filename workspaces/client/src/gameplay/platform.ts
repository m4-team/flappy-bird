import { GAME_WIDTH } from "./consts";
import { Doodle } from "./doodle";

export enum PlatformType {
    Normal = 1,
    Moving,
    Breakable,
    Vanishable
}

export class Platform extends Phaser.GameObjects.Image {
    pt: PlatformType = PlatformType.Normal;
    vx: number = 0;
    isBroken : boolean = false;
    isVanished : boolean = false;

    constructor(type:PlatformType, scene: Phaser.Scene, y:number) {
        super(scene, 0, y, 'atlas', 'platform-' + type);
        this.init(type, y);
        this.displayWidth = 70;
        this.displayHeight = 17;
        scene.add.existing(this);
    }

    init(type: PlatformType, y: number) {
        this.x = Math.random() * (GAME_WIDTH - this.displayWidth);
        this.y = y;
        this.vx = 0;
        this.isBroken = false;
        this.isVanished = false;
        this.visible = true;
        this.pt = type;
        this.setFrame('platform-' + this.pt);
        if (type == PlatformType.Moving) {
            this.vx = 1;
        } else {
            this.vx = 0;
        }
    }

    update() {
        if (this.pt == PlatformType.Moving) {
            if (this.x < 0 || this.x + this.displayWidth > GAME_WIDTH) {
                this.vx = -this.vx;
            }
            this.x += this.vx;
        }
    }
    
    checkCollision(doodle: Doodle) {
        if (doodle.vy > 0 && this.isVanished == false && 
            doodle.x + 15 < this.x + this.displayWidth &&
            doodle.x + doodle.displayWidth - 15 > this.x &&
            doodle.y + doodle.displayHeight > this.y &&
            doodle.y + doodle.displayHeight < this.y + this.displayHeight) {
            
            if (this.pt == PlatformType.Breakable && this.isBroken == false) {
                this.isBroken = true;
                this.setFrame('platform-broken');
                doodle.jumpCount = 0;
            } else if (this.pt == PlatformType.Vanishable) {
                doodle.jump();
                this.isVanished = true;
                this.visible = false;
            } else if (this.isBroken == false) {
                doodle.jump();
            }
        }
    }
}