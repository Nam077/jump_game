import Phaser from 'phaser'
import GameObject = Phaser.GameObjects.GameObject;

const GROUND_KEY = 'ground'
const DUDE_KEY = 'dude'
const STAR_KEY = 'star'
const BOMB_KEY = 'bomb'
export default class GameScene extends Phaser.Scene {

    private player: undefined | Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private stars: Phaser.Physics.Arcade.Group | undefined;

    private platForms: Phaser.Physics.Arcade.StaticGroup | undefined;
    private bombSpawner: BombSpawner | undefined;

    private bombsGroup: Phaser.Physics.Arcade.Group | undefined;

    private gameOver: boolean;
    private scoreLabel: ScoreLabel | undefined;

    constructor() {
        super('game-scene')
        this.player = undefined
        this.cursors = undefined
        this.stars = undefined
        this.platForms = undefined
        this.scoreLabel = undefined
        this.bombSpawner = undefined
        this.bombsGroup = undefined
        this.gameOver = false
    }

    preload() {
        this.load.image('sky', 'assets/sky.png')
        this.load.image(GROUND_KEY, 'assets/platform.png')
        this.load.image(STAR_KEY, 'assets/star.png')
        this.load.image(BOMB_KEY, 'assets/bomb.png')
        this.load.image('bomb', 'assets/bomb.png')
        this.load.spritesheet(DUDE_KEY,
            'assets/dude.png',
            {frameWidth: 32, frameHeight: 48}
        )
    }

    private handleCollectStar(player: Phaser.GameObjects.GameObject, star: Phaser.GameObjects.GameObject) {
        const s = star as Phaser.Physics.Arcade.Image
        s.disableBody(true, true)
        this.scoreLabel?.add(10)
        if (this.stars?.countActive(true) === 0) {
            //  A new batch of stars to collect
            this.stars.children.iterate(c => {
                const child = c as Phaser.Physics.Arcade.Image
                child.enableBody(true, child.x, 0, true, true)
            })

        }
        if (this.player) {
            const x = this.player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400)
            const bomb = this.bombsGroup?.create(x, 16, BOMB_KEY) as Phaser.Physics.Arcade.Image
            bomb.setBounce(1)
            bomb.setCollideWorldBounds(true)
            bomb.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200))
        }

    }

    handleHitBomb(player: Phaser.GameObjects.GameObject, bomb: Phaser.GameObjects.GameObject) {
        this.physics.pause()
        this.gameOver = true
        this.player?.setTint(0xff0000)
        this.player?.setVelocity(0, 0)
        this.player?.anims.play('turn', true)
        this.player?.anims.stop()
    }

    create() {
        this.add.image(400, 300, 'sky')
        // this.add.image(400, 300, 'star')
        this.stars = this.createStars();
        this.scoreLabel = this.createScoreLabel(16, 16, 0)
        this.createPlatforms()
        this.createPlayer()
        this.platForms = this.createPlatforms()
        this.player = this.createPlayer()
        this.physics.add.collider(this.player, this.platForms)
        this.physics.add.collider(this.stars, this.platForms)
        this.cursors = this.input.keyboard.createCursorKeys()
        this.physics.add.overlap(this.player, this.stars, this.handleCollectStar, undefined, this)
        this.bombSpawner = new BombSpawner(this, BOMB_KEY)
        this.bombsGroup = this.bombSpawner.group
        this.physics.add.collider(this.bombsGroup, this.platForms)
        this.physics.add.overlap(this.player, this.bombsGroup, this.handleHitBomb, undefined, this)
    }

    update() {
        if (this.gameOver) {
            this.physics.pause()

            if (this.player) {
                this.player.setTint(0xff0000)

                this.player.anims.play('turn')

                this.gameOver = true
            }
        }
        if (this.cursors && this.player) {
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-160)

                this.player.anims.play('left', true)
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(160)

                this.player.anims.play('right', true)
            } else {
                this.player.setVelocityX(0)

                this.player.anims.play('turn')
            }

            if (this.cursors.up.isDown && this.player.body.touching.down) {
                this.player.setVelocityY(-330)
            }
        }
    }


    createPlatforms() {
        const platforms = this.physics.add.staticGroup()

        platforms.create(400, 568, GROUND_KEY).setScale(2).refreshBody()

        platforms.create(600, 400, GROUND_KEY)
        platforms.create(50, 250, GROUND_KEY)
        platforms.create(750, 220, GROUND_KEY)

        return platforms
    }

    createPlayer() {
        const player = this.physics.add.sprite(100, 450, DUDE_KEY)
        player.setBounce(0.2)
        player.setCollideWorldBounds(true)

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers(DUDE_KEY, {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: 'turn',
            frames: [{key: DUDE_KEY, frame: 4}],
            frameRate: 20
        })

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers(DUDE_KEY, {start: 5, end: 8}),
            frameRate: 10,
            repeat: -1
        })

        return player
    }

    private createStars() {
        const stars = this.physics.add.group({
            key: STAR_KEY,
            repeat: 11,
            setXY: {x: 12, y: 0, stepX: 70}
        })

        stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
            (child as Phaser.Physics.Arcade.Image).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        return stars
    }

    createScoreLabel(x: number, y: number, score: number) {
        const style = {fontSize: '32px', fill: '#000'}
        const label = new ScoreLabel(this, x, y, score, style)

        this.add.existing(label)

        return label
    }
}
const formatScore = (score: any) => `Score: ${score}`

class ScoreLabel extends Phaser.GameObjects.Text {
    private score: any;

    constructor(scene: Phaser.Scene, x: number, y: number, score: any, style: Phaser.Types.GameObjects.Text.TextStyle) {
        super(scene, x, y, formatScore(score), style)

        this.score = score
    }

    setScore(score: any) {
        this.score = score
        this.updateScoreText()
    }

    add(points: any) {
        this.setScore(this.score + points)
    }

    updateScoreText() {
        this.setText(formatScore(this.score))
    }
}

class BombSpawner {
    /**
     * @param {Phaser.Scene} scene
     */
    private scene: Phaser.Scene;
    private readonly key: string;
    private readonly _group: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene, bombKey: string) {
        this.scene = scene
        this.key = bombKey

        this._group = this.scene.physics.add.group()
    }

    get group() {
        return this._group
    }

    spawn(playerX = 0) {
        const x = (playerX < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400)

        const bomb = this.group.create(x, 16, this.key)
        bomb.setBounce(1)
        bomb.setCollideWorldBounds(true)
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20)

        return bomb
    }
}