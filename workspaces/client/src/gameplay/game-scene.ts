import * as Phaser from 'phaser';
import { BG_HEIGHT, COLUMN_ACCEL, COLUMN_TIME_ACCEL, FLAP_THRESH, GAME_HEIGHT, GAME_WIDTH, GAP_END, GAP_MAX, GAP_MIN, GAP_START, GRAVITY, INITIAL_COLUMN_INTERVAL, INITIAL_COLUMN_VELOCITY, JUMP_COOLDOWN, JUMP_VEL, PIPE_HEIGHT, PIPE_SCALE, PIPE_WIDTH, PLATFORM_COUNT } from './consts';
import { Platform, PlatformType } from './platform';
import { Doodle } from './doodle';
import { Spring } from './spring';

export class GameScene extends Phaser.Scene {
    doodle!: Doodle;
    base!: Phaser.GameObjects.Image;
    background!: Phaser.GameObjects.TileSprite;
    platforms: Platform[] = [];
    spring!: Spring;
    firstRun : boolean = false;
    score : number = 0;
    newPlatformY : number = 0;
    isGameOver:boolean = false;
    isGameOverFalling:boolean = false;

    onGameOver?: (results?: { reward: 0, achievements: string[] } | { error: string }) => void;
    
    /*
    constructor(private ui: UI) {
        super();

        ui.onPlayClicked(() => {
            ui.hideShop();
            ui.hideMain();

            this.scene.restart();
        });
    }
    */
    constructor ()
    {
        super('DoodleJump');
    }

    getRealGameWidth() {
        return GAME_WIDTH * (this.game.canvas.parentElement!.clientWidth / this.game.canvas.clientWidth);
    }

    preload() {
        this.load.image('bg', 'assets/doodle-jump-bg.png');
        this.load.atlas('atlas', 'assets/doodle-jump-atlas.png', 'assets/doodle-jump-atlas.json');
    }

    create() {
        const realWidth = this.getRealGameWidth();
        this.base = this.add.image(0, GAME_HEIGHT, 'atlas', 'base');
        this.base.displayWidth = GAME_WIDTH;
        this.base.y = GAME_HEIGHT - this.base.displayHeight;
        this.background = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'bg');
        this.background.tileScaleX = this.background.tileScaleY = GAME_HEIGHT / BG_HEIGHT;

        for (let i = 0; i < PLATFORM_COUNT; i++) {
            const platform = new Platform(this.getRandomPlatformType(), this, this.newPlatformY);
            this.newPlatformY += GAME_HEIGHT / PLATFORM_COUNT;
            this.platforms.push(platform);
        }

        this.spring = new Spring(this);
        this.doodle = new Doodle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // this.input.on('pointerdown', () => this.onInput());
        this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.onKeyDown(e));
        this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.onKeyUp(e));
        this.input.on('touchstart', (e: TouchEvent) => this.onTouchStart(e));
        this.input.on('touchend', (e: TouchEvent) => this.onTouchEnd(e));
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === 'a') {
            this.doodle.facing = -1;
            this.doodle.isMovingLeft = true;
        } else if (e.key === 'd') {
            this.doodle.facing = 1;
            this.doodle.isMovingRight = true;
        }
    }
    onKeyUp(e: KeyboardEvent) {
        if (e.key === 'a') {
            this.doodle.isMovingLeft = false;
        } else if (e.key === 'd') {
            this.doodle.isMovingRight = false;
        }
    }    

    onTouchStart(e: TouchEvent) {
        if (e.touches[0].clientX < GAME_WIDTH / 2) {
            this.doodle.facing = -1;
            this.doodle.isMovingLeft = true;
        } else {
            this.doodle.facing = 1;
            this.doodle.isMovingRight = true;
        }
    }
    onTouchEnd(e: TouchEvent) {
        this.doodle.isMovingLeft = false;
        this.doodle.isMovingRight = false;
    }

    update(time: number, delta: number): void {
        this.doodle.update();

		//Jump the player when it hits the base
		if ((this.doodle.y + this.doodle.displayHeight) > this.base.y && this.base.y < GAME_HEIGHT) {
            this.doodle.jump();
        }

		//Gameover if it hits the bottom 
		if (this.base.y > GAME_HEIGHT && (this.doodle.y + this.doodle.displayHeight) > GAME_HEIGHT && !this.isGameOver) {
            this.doodle.isDead = true;
        }
        
		//Make the player move through walls
		if (this.doodle.x > GAME_WIDTH) this.doodle.x = 0 - this.doodle.displayWidth;
		else if (this.doodle.x < 0 - this.doodle.displayWidth) this.doodle.x = GAME_WIDTH;

		//Movement of player affected by gravity
		if (this.doodle.y >= (GAME_HEIGHT / 2) - (this.doodle.displayHeight / 2)) {
			this.doodle.y += this.doodle.vy;
			this.doodle.vy += GRAVITY;
		} else {
            //When the player reaches half height, move the platforms to create the illusion of scrolling and recreate the platforms that are out of viewport...
            this.platforms.forEach((platform) => {
                if (this.doodle.vy < 0) {
                    platform.y -= this.doodle.vy;
                }

                if (platform.y > GAME_HEIGHT) {
                    const py = platform.y;
                    platform.init(this.getRandomPlatformType(), this.newPlatformY);
                    platform.y = py - GAME_HEIGHT;
                    this.newPlatformY += GAME_HEIGHT / PLATFORM_COUNT;
                }
            });

            this.base.y -= this.doodle.vy;
            this.doodle.vy += GRAVITY;

            if (this.doodle.vy >= 0) {
                this.doodle.y += this.doodle.vy;
                this.doodle.vy += GRAVITY;
            }

            this.score++;
        }

		//Make the player jump when it collides with platforms
        this.platforms.forEach((platform) => {
            platform.update();
            platform.checkCollision(this.doodle);
        });

        //Springs
        this.spring.update(this.platforms[0]);
        this.spring.checkCollision(this.doodle);

        if (this.doodle.isDead) {
            this.updateGameOver();
        }
    }

    lastPlatformType : number = 0;
    getRandomPlatformType() {
        var types = [];
        if (this.score >= 5000) types = [2, 3, 3, 3, 4, 4, 4, 4];
        else if (this.score >= 2000 && this.score < 5000) types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
        else if (this.score >= 1000 && this.score < 2000) types = [2, 2, 2, 3, 3, 3, 3, 3];
        else if (this.score >= 500 && this.score < 1000) types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
        else if (this.score >= 100 && this.score < 500) types = [1, 1, 1, 1, 2, 2];
        else types = [1];

        var type = types[Math.floor(Math.random() * types.length)];
	    //We can't have two consecutive breakable platforms otherwise it will be impossible to reach another platform sometimes!
        if (type == PlatformType.Breakable && this.lastPlatformType == PlatformType.Breakable) {
            type = PlatformType.Normal;
        }
        this.lastPlatformType = type;
        return type;
    }

    updateGameOver() {
        this.platforms.forEach((platform) => {
            platform.y -= 12;
        });

        if (this.doodle.y > GAME_HEIGHT / 2 && !this.isGameOverFalling) {
            this.doodle.y -= 8;
            this.doodle.vy = 0;
        } else if (this.doodle.y < GAME_HEIGHT / 2) {
            this.isGameOverFalling = true;
        } else if (this.doodle.y + this.doodle.displayHeight > GAME_HEIGHT) {
            this.isGameOver = true;
            this.doodle.isDead = false;
            if (this.onGameOver) {
                this.onGameOver();
            }
        }
    }
}
