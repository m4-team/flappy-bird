import { GAME_HEIGHT, GAME_WIDTH } from "./consts";

export class Doodle extends Phaser.GameObjects.Image {
    facing: number = 1;
    vx: number = 0;
    vy: number = 0;
    isMovingLeft: boolean = false;
    isMovingRight: boolean = false;
    jumpCount: number = 0;
    isDead: boolean = false;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'atlas', 'doodle-right');
        this.displayWidth = 55;
        this.displayHeight = 40;
        scene.add.existing(this);
        this.reset();
    }

    reset() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT;
        this.vx = 0;
        this.vy = 11;
        this.isDead = false;
        this.jumpCount = 0;
    }

    jump() {
        this.vy = -8;
    }

    jumpHigh() {
        this.vy = -16;
    }

    update() {
        if (this.vy < -7 && this.vy > -15) {
            this.setFrame(this.facing > 0 ? 'doodle-right-land' : 'doodle-left-land');
        } else {
            this.setFrame(this.facing > 0 ? 'doodle-right' : 'doodle-left');
        }

        //Accelerations produces when the user hold the keys
        if (this.isMovingLeft) {
            this.x += this.vx;
            this.vx -= 0.15;
        } else {
            this.x += this.vx;
            if (this.vx < 0) this.vx += 0.1;
        }

        if (this.isMovingRight) {
            this.x += this.vx;
            this.vx += 0.15;
        } else {
            this.x += this.vx;
            if (this.vx >0 ) this.vx -= 0.1;
        }

		// Speed limits!
        this.vx = Math.min(8, Math.max(-8, this.vx));
    }
}