import { GAME_HEIGHT } from "./consts";
import { Doodle } from "./doodle";
import { Platform, PlatformType } from "./platform";

export class Spring extends Phaser.GameObjects.Sprite {
    isUp: boolean = false;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'atlas', 'spring');
        this.x = -this.displayWidth;
        this.y = -this.displayHeight;
        this.displayWidth = 26;
        this.displayHeight = 30;
        scene.add.existing(this);
    }

    checkCollision(doodle: Doodle) {
        if (doodle.vy > 0 && this.isUp == false &&
            doodle.x + 15 < this.x + this.displayWidth &&
            doodle.x + doodle.displayWidth - 15 > this.x &&
            doodle.y + doodle.displayHeight > this.y &&
            doodle.y + doodle.displayHeight < this.y + this.displayHeight) {
            doodle.jumpHigh();
            this.isUp = true;
            this.setFrame('spring-up');
        }
    }

    update(platform:Platform) {
        if (platform && (platform.pt == PlatformType.Normal || platform.pt == PlatformType.Moving)) {
            this.x = platform.x + platform.displayWidth / 2 - this.displayWidth / 2;
            this.y = platform.y - this.displayHeight - 10;

            if (this.y > GAME_HEIGHT / 1.1) {
                this.isUp = false;
                this.setFrame('spring');
            }
        } else {
            this.x = -this.displayWidth;
            this.y = -this.displayHeight;
        }

    }
}