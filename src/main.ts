import Phaser from "phaser";
import "./styles.css";

function createShell() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="shell">
      <section class="stage-wrap">
        <div id="game" class="game"></div>
        <div class="hud">
          <div><span>SCORE</span><strong id="score">0</strong></div>
          <div><span>STAGE</span><strong id="wave">1</strong></div>
          <div><span>LIVES</span><strong id="lives">5</strong></div>
          <div><span>GOLD</span><strong id="gold">0</strong></div>
          <div><span>KILLS</span><strong id="combo">0/50</strong></div>
        </div>
        <div id="status" class="status">DRAW!</div>
        <div id="shop" class="shop hidden">
          <div class="shop-window">
            <h2 id="shop-title">SHOP</h2>
            <p id="shop-gold">Gold 0</p>
            <div class="shop-grid">
              <button id="buy-damage" type="button"><i class="item-icon shotgun"></i><span>Powder</span><small>Damage up</small></button>
              <button id="buy-range" type="button"><i class="item-icon rifle"></i><span>Barrel</span><small>Range up</small></button>
              <button id="buy-reload" type="button"><i class="item-icon gatling"></i><span>Trigger</span><small>Reload up</small></button>
              <button id="buy-pierce" type="button"><i class="item-icon rifle"></i><span>Piercer</span><small>Pierce up</small></button>
              <button id="buy-life" type="button"><i class="item-icon potion"></i><span>Iron Heart</span><small>Max life up</small></button>
              <button id="buy-potion" type="button"><i class="item-icon potion"></i><span>Healing Potion</span><small>Restore 2 hearts</small></button>
              <button id="buy-dynamite" type="button"><i class="item-icon dynamite"></i><span>Dynamite</span><small>Clear screen / Max 3</small></button>
            </div>
            <button id="continue-stage" class="continue" type="button">Next Stage</button>
          </div>
        </div>
        <div id="intro" class="intro">
          <div class="intro-art" role="img" aria-label="Mumu Brothers intro artwork"></div>
          <button id="start-game" class="start-game" type="button">START</button>
        </div>
        <div class="touch-controls" aria-label="Touch controls">
          <div class="touch-pad" aria-label="Move">
            <button class="touch-btn touch-up" data-move="up" type="button" aria-label="Move up">U</button>
            <button class="touch-btn touch-left" data-move="left" type="button" aria-label="Move left">L</button>
            <button class="touch-btn touch-right" data-move="right" type="button" aria-label="Move right">R</button>
            <button class="touch-btn touch-down" data-move="down" type="button" aria-label="Move down">D</button>
          </div>
          <div class="touch-actions" aria-label="Actions">
            <button id="touch-dynamite" class="touch-action dynamite" type="button">BOMB</button>
          </div>
        </div>
      </section>
      <aside class="panel">
        <h1>Mumu Brothers</h1>
        <p>10-stage boss rush frontier shooter</p>
        <div class="controls">
          <span>A/D or arrows</span><b>move</b>
          <span>Mouse</span><b>aim</b>
          <span>Tap target or Z/X/C/Space</span><b>fire</b>
          <span>F</span><b>dynamite</b>
          <span>R</span><b>restart</b>
        </div>
      </aside>
    </main>
  `;
}

type StageTheme = {
  name: string;
  skyTop: number;
  skyBottom: number;
  ground: number;
  trim: number;
  accent: number;
  signs: string[];
  prop: "barrel" | "crate" | "cactus" | "ore" | "lantern";
  motif: "town" | "desert" | "mine" | "rail" | "canyon" | "night" | "river" | "fort";
  bossName?: string;
  enemyTint?: number;
  bossTint?: number;
  wash?: number;
  background: string;
  enemyPool: string[];
  bossEnemy: string;
  bossSprite: keyof typeof BOSS_SPRITES;
};

type Enemy = {
  sprite: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  hp: number;
  speed: number;
  lane: number;
  nextShot: number;
  nextMove: number;
  minX: number;
  maxX: number;
  direction: number;
  coverY: number;
  isBoss: boolean;
  goldValue: number;
  alive: boolean;
};

type SpawnPoint = {
  x: number;
  y: number;
  minX: number;
  maxX: number;
  kind: "window" | "door" | "balcony" | "street" | "edge";
};

type Prop = {
  sprite: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  hp: number;
};

type Bullet = {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  life: number;
};

type WeaponKind = "pistol" | "shotgun" | "rifle" | "gatling";

const SPRITES = {
  heroRed: { x: 42, y: 42, w: 285, h: 282 },
  heroBlue: { x: 374, y: 38, w: 290, h: 288 },
  bandit: { x: 718, y: 46, w: 284, h: 282 },
  rifle: { x: 1080, y: 54, w: 390, h: 270 },
  barrel: { x: 42, y: 364, w: 152, h: 210 },
  brokenBarrel: { x: 224, y: 370, w: 166, h: 206 },
  crate: { x: 668, y: 380, w: 178, h: 184 },
  brokenCrate: { x: 900, y: 382, w: 180, h: 178 },
  cactus: { x: 1160, y: 362, w: 138, h: 214 },
  lantern: { x: 1348, y: 352, w: 122, h: 232 },
  muzzle: { x: 24, y: 620, w: 244, h: 110 },
  smallMuzzle: { x: 360, y: 646, w: 118, h: 72 },
  explosion: { x: 42, y: 760, w: 226, h: 212 },
  dust: { x: 1152, y: 788, w: 250, h: 146 }
};

const ENEMY_SPRITES = {
  maskedOutlaw: { texture: "enemyTypes1", x: 116, y: 62, w: 280, h: 388 },
  rifleDesperado: { texture: "enemyTypes1", x: 620, y: 62, w: 296, h: 388 },
  cactusMutant: { texture: "enemyTypes1", x: 82, y: 555, w: 348, h: 426 },
  scorpionBandit: { texture: "enemyTypes1", x: 590, y: 575, w: 356, h: 386 },
  ghostMiner: { texture: "enemyTypes2", x: 114, y: 60, w: 284, h: 392 },
  dynamiteThrower: { texture: "enemyTypes2", x: 627, y: 64, w: 282, h: 384 },
  trainRobber: { texture: "enemyTypes2", x: 110, y: 581, w: 292, h: 374 },
  armoredSheriff: { texture: "enemyTypes2", x: 585, y: 552, w: 366, h: 432 },
  vampireCowboy: { texture: "enemyTypes3", x: 87, y: 50, w: 338, h: 412 },
  demonOutlaw: { texture: "enemyTypes3", x: 603, y: 28, w: 330, h: 456 },
  swampZombie: { texture: "swampEnemies1", x: 16, y: 147, w: 423, h: 560 },
  gatorOutlaw: { texture: "swampEnemies1", x: 443, y: 160, w: 444, h: 541 },
  poisonFrog: { texture: "swampEnemies1", x: 887, y: 189, w: 443, h: 505 },
  wispGunslinger: { texture: "swampEnemies1", x: 1330, y: 153, w: 421, h: 554 },
  voodooMask: { texture: "swampEnemies2", x: 9, y: 114, w: 434, h: 613 },
  skeletalFerryman: { texture: "swampEnemies2", x: 443, y: 152, w: 444, h: 579 },
  leechMutant: { texture: "swampEnemies2", x: 887, y: 161, w: 443, h: 561 },
  mossWitch: { texture: "swampEnemies2", x: 1330, y: 129, w: 430, h: 590 },
  mosquitoGunslinger: { texture: "swampEnemies3", x: 39, y: 121, w: 848, h: 632 },
  boneAlligator: { texture: "swampEnemies3", x: 887, y: 165, w: 883, h: 568 }
};

const BOSS_SPRITES = {
  marshalBragg: { texture: "bossTypes1", x: 21, y: 101, w: 570, h: 642 },
  cactusJack: { texture: "bossTypes1", x: 591, y: 104, w: 591, h: 633 },
  ironBelle: { texture: "bossTypes1", x: 1182, y: 121, w: 588, h: 629 },
  coalBaron: { texture: "bossTypes2", x: 90, y: 118, w: 678, h: 757 },
  lastBrother: { texture: "bossTypes2", x: 768, y: 77, w: 696, h: 814 },
  gatorKing: { texture: "swampBosses1", x: 3, y: 43, w: 588, h: 768 },
  candleWitch: { texture: "swampBosses1", x: 591, y: 35, w: 591, h: 782 },
  steamboatRevenant: { texture: "swampBosses1", x: 1182, y: 100, w: 560, h: 711 },
  boneMarketBaron: { texture: "swampBosses2", x: 0, y: 52, w: 858, h: 807 },
  heartrootLeviathan: { texture: "swampBosses2", x: 858, y: 6, w: 822, h: 892 }
};

const SPAWN_POINTS: SpawnPoint[] = [
  { x: 46, y: 306, minX: 24, maxX: 116, kind: "edge" },
  { x: 116, y: 286, minX: 72, maxX: 168, kind: "window" },
  { x: 254, y: 296, minX: 210, maxX: 302, kind: "door" },
  { x: 388, y: 300, minX: 340, maxX: 430, kind: "street" },
  { x: 522, y: 284, minX: 470, maxX: 584, kind: "balcony" },
  { x: 632, y: 292, minX: 592, maxX: 682, kind: "window" },
  { x: 752, y: 300, minX: 704, maxX: 802, kind: "door" },
  { x: 888, y: 296, minX: 810, maxX: 924, kind: "edge" }
];

const KILLS_TO_BOSS_BY_STAGE = [50, 100, 200, 300, 500, 150, 250, 350, 450, 650];

const STAGES: StageTheme[] = [
  { name: "Dustbell Main", skyTop: 0x35201a, skyBottom: 0xb86b32, ground: 0xb36c32, trim: 0xf2c66b, accent: 0xa7472e, signs: ["SALOON", "BANK", "HOTEL"], prop: "barrel", motif: "town", bossName: "Marshal Bragg", enemyTint: 0xffffff, bossTint: 0xffc45f, wash: 0.03, background: "stageBackground1", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff", bossSprite: "marshalBragg" },
  { name: "Red Mesa", skyTop: 0x45251e, skyBottom: 0xd0843e, ground: 0xc96f35, trim: 0xf4c96e, accent: 0xb74b2d, signs: ["DEPOT", "JAIL", "STORE"], prop: "cactus", motif: "desert", bossName: "Cactus Jack", enemyTint: 0xffffff, bossTint: 0x9cff73, wash: 0.04, background: "stageBackground2", enemyPool: ["cactusMutant", "scorpionBandit", "dynamiteThrower"], bossEnemy: "cactusMutant", bossSprite: "cactusJack" },
  { name: "Coyote Rail", skyTop: 0x26314a, skyBottom: 0xb66537, ground: 0x9f6633, trim: 0xd9b15a, accent: 0x4e684d, signs: ["STATION", "CARGO", "WATER"], prop: "crate", motif: "rail", bossName: "Iron Belle", enemyTint: 0xffffff, bossTint: 0x82a8ff, wash: 0.05, background: "stageBackground3", enemyPool: ["trainRobber", "rifleDesperado", "dynamiteThrower"], bossEnemy: "armoredSheriff", bossSprite: "ironBelle" },
  { name: "Black Spur Mine", skyTop: 0x17191f, skyBottom: 0x6b4b36, ground: 0x71543e, trim: 0xcaa45c, accent: 0x385d4f, signs: ["MINE", "ASSAY", "TOOLS"], prop: "ore", motif: "mine", bossName: "Coal Baron", enemyTint: 0xffffff, bossTint: 0xff7777, wash: 0.07, background: "stageBackground4", enemyPool: ["ghostMiner", "trainRobber", "armoredSheriff"], bossEnemy: "ghostMiner", bossSprite: "coalBaron" },
  { name: "Boss Town", skyTop: 0x120e16, skyBottom: 0x5a2532, ground: 0x5e3732, trim: 0xffcc6d, accent: 0x9f2525, signs: ["BOSS", "BLOOD", "END"], prop: "lantern", motif: "fort", bossName: "The Last Brother", enemyTint: 0xffffff, bossTint: 0xff3c3c, wash: 0.06, background: "stageBackground5", enemyPool: ["vampireCowboy", "demonOutlaw", "armoredSheriff"], bossEnemy: "demonOutlaw", bossSprite: "lastBrother" },
  { name: "Cursed Swamp Outpost", skyTop: 0x10251d, skyBottom: 0x2e6a4d, ground: 0x314024, trim: 0x9adf8e, accent: 0x5bcf80, signs: ["SWAMP", "DOCK", "FROG"], prop: "lantern", motif: "river", bossName: "Gator King", enemyTint: 0xffffff, bossTint: 0x8cff7a, wash: 0.06, background: "stageBackground6", enemyPool: ["swampZombie", "gatorOutlaw", "poisonFrog"], bossEnemy: "gatorOutlaw", bossSprite: "gatorKing" },
  { name: "Witchfire Bayou", skyTop: 0x140d25, skyBottom: 0x295b37, ground: 0x263820, trim: 0xd7a75b, accent: 0x8d55c7, signs: ["BAYOU", "HEX", "BONE"], prop: "lantern", motif: "night", bossName: "Candle Witch Queen", enemyTint: 0xffffff, bossTint: 0xd98cff, wash: 0.07, background: "stageBackground7", enemyPool: ["wispGunslinger", "voodooMask", "mossWitch"], bossEnemy: "mossWitch", bossSprite: "candleWitch" },
  { name: "Steamboat Graveyard", skyTop: 0x10222b, skyBottom: 0x27605c, ground: 0x35412f, trim: 0x8fe5d2, accent: 0xb4773e, signs: ["RIVER", "WRECK", "CHAIN"], prop: "crate", motif: "river", bossName: "Steamboat Revenant", enemyTint: 0xffffff, bossTint: 0x9effee, wash: 0.06, background: "stageBackground8", enemyPool: ["skeletalFerryman", "leechMutant", "mosquitoGunslinger"], bossEnemy: "skeletalFerryman", bossSprite: "steamboatRevenant" },
  { name: "Voodoo Bone Market", skyTop: 0x1b1021, skyBottom: 0x3a5730, ground: 0x3b3023, trim: 0xffd176, accent: 0xb35ad8, signs: ["MASK", "CHARM", "BREW"], prop: "barrel", motif: "night", bossName: "Bone Market Baron", enemyTint: 0xffffff, bossTint: 0xffd176, wash: 0.07, background: "stageBackground9", enemyPool: ["voodooMask", "boneAlligator", "poisonFrog"], bossEnemy: "voodooMask", bossSprite: "boneMarketBaron" },
  { name: "Heartroot Swamp", skyTop: 0x0b1110, skyBottom: 0x1d5a35, ground: 0x223421, trim: 0x7aff9e, accent: 0x23d276, signs: ["ROOT", "CURSE", "END"], prop: "ore", motif: "fort", bossName: "Heartroot Leviathan", enemyTint: 0xffffff, bossTint: 0x7aff9e, wash: 0.08, background: "stageBackground10", enemyPool: ["mossWitch", "wispGunslinger", "leechMutant", "boneAlligator"], bossEnemy: "boneAlligator", bossSprite: "heartrootLeviathan" }
];

class MumuBrothersScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private reticle!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private worldObjects: Phaser.GameObjects.GameObject[] = [];
  private enemies: Enemy[] = [];
  private props: Prop[] = [];
  private bullets: Bullet[] = [];
  private score = 0;
  private gold = 0;
  private lives = 5;
  private maxLives = 5;
  private wave = 1;
  private combo = 0;
  private stageKills = 0;
  private killTarget = 50;
  private bossSpawned = false;
  private gameStarted = false;
  private inShop = false;
  private weapon: WeaponKind = "pistol";
  private gatlingAmmo = 0;
  private dynamite = 0;
  private gunDamageLevel = 0;
  private gunRangeLevel = 0;
  private gunReloadLevel = 0;
  private gunPierceLevel = 0;
  private maxLifeLevel = 0;
  private isPointerDown = false;
  private touchMove = { x: 0, y: 0 };
  private activeTouchMoves = new Set<string>();
  private nextPlayerShot = 0;
  private nextEnemyShot = 0;
  private nextSpawn = 0;
  private invulnerableUntil = 0;
  private continuesLeft = 3;
  private scoreText!: HTMLElement;
  private waveText!: HTMLElement;
  private livesText!: HTMLElement;
  private goldText!: HTMLElement;
  private comboText!: HTMLElement;
  private statusText!: HTMLElement;
  private shopOverlay!: HTMLElement;
  private shopTitle!: HTMLElement;
  private shopGoldText!: HTMLElement;
  private introOverlay!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private touchDynamiteButton!: HTMLButtonElement;
  private buyDamageButton!: HTMLButtonElement;
  private buyRangeButton!: HTMLButtonElement;
  private buyReloadButton!: HTMLButtonElement;
  private buyPierceButton!: HTMLButtonElement;
  private buyLifeButton!: HTMLButtonElement;
  private buyPotionButton!: HTMLButtonElement;
  private buyDynamiteButton!: HTMLButtonElement;
  private continueButton!: HTMLButtonElement;
  private isGameOver = false;
  private waitingForContinue = false;

  constructor() {
    super("mumu-brothers");
  }

  preload() {
    this.load.image("stageBackground1", "/assets/mvp-background.png");
    this.load.image("stageBackground2", "/assets/stage-2-red-mesa.png");
    this.load.image("stageBackground3", "/assets/stage-3-coyote-rail.png");
    this.load.image("stageBackground4", "/assets/stage-4-black-spur-mine.png");
    this.load.image("stageBackground5", "/assets/stage-5-boss-town.png");
    this.load.image("stageBackground6", "/assets/stage-6-cursed-swamp-outpost.png");
    this.load.image("stageBackground7", "/assets/stage-7-witchfire-bayou.png");
    this.load.image("stageBackground8", "/assets/stage-8-steamboat-graveyard.png");
    this.load.image("stageBackground9", "/assets/stage-9-voodoo-bone-market.png");
    this.load.image("stageBackground10", "/assets/stage-10-heartroot-swamp.png");
    this.load.image("mvpSprites", "/assets/mvp-sprites.png");
    this.load.image("enemyTypes1", "/assets/enemy-types-1.png");
    this.load.image("enemyTypes2", "/assets/enemy-types-2.png");
    this.load.image("enemyTypes3", "/assets/enemy-types-3.png");
    this.load.image("swampEnemies1", "/assets/swamp-enemies-1.png");
    this.load.image("swampEnemies2", "/assets/swamp-enemies-2.png");
    this.load.image("swampEnemies3", "/assets/swamp-enemies-3.png");
    this.load.image("bossTypes1", "/assets/boss-types-1.png");
    this.load.image("bossTypes2", "/assets/boss-types-2.png");
    this.load.image("swampBosses1", "/assets/swamp-bosses-1.png");
    this.load.image("swampBosses2", "/assets/swamp-bosses-2.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#191310");
    this.applyStartParams();
    this.createHud();
    this.registerSpriteFrames();
    this.createWorld();
    this.createPlayer();
    this.createReticle();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,Z,X,C,F,SPACE,ENTER,R") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.reticle.setPosition(pointer.x, pointer.y));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted) return;
      if (this.waitingForContinue) {
        this.continueGame();
        return;
      }
      this.isPointerDown = true;
      this.reticle.setPosition(pointer.x, pointer.y);
      this.shoot();
    });
    this.input.on("pointerup", () => {
      this.isPointerDown = false;
    });
    this.updateHud();
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.startGame();
      return;
    }
    if (this.inShop) return;

    if (this.isGameOver) {
      if (this.waitingForContinue && (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE))) {
        this.continueGame();
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
        this.scene.restart();
      }
      return;
    }

    this.handleInput(delta);
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.Z) ||
      Phaser.Input.Keyboard.JustDown(this.keys.X) ||
      Phaser.Input.Keyboard.JustDown(this.keys.C)
    ) {
      this.shoot();
    }
    if (this.isPointerDown) this.shoot();
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.throwDynamite();

    const activeCap = this.bossSpawned ? 8 : Math.min(16 + this.wave * 3, 32);
    if (time > this.nextSpawn && this.enemies.filter((enemy) => enemy.alive).length < activeCap) {
      this.spawnEnemy();
      this.nextSpawn = time + Math.max(140, 360 - this.wave * 22);
    }

    this.updateEnemies(time, delta);
    this.updateBullets(delta);

    if (!this.bossSpawned && this.stageKills >= this.killTarget) this.spawnBoss();
  }

  private createHud() {
    this.scoreText = document.querySelector("#score")!;
    this.waveText = document.querySelector("#wave")!;
    this.livesText = document.querySelector("#lives")!;
    this.goldText = document.querySelector("#gold")!;
    this.comboText = document.querySelector("#combo")!;
    this.statusText = document.querySelector("#status")!;
    this.shopOverlay = document.querySelector("#shop")!;
    this.shopTitle = document.querySelector("#shop-title")!;
    this.shopGoldText = document.querySelector("#shop-gold")!;
    this.introOverlay = document.querySelector("#intro")!;
    this.startButton = document.querySelector("#start-game")!;
    this.touchDynamiteButton = document.querySelector("#touch-dynamite")!;
    this.buyDamageButton = document.querySelector("#buy-damage")!;
    this.buyRangeButton = document.querySelector("#buy-range")!;
    this.buyReloadButton = document.querySelector("#buy-reload")!;
    this.buyPierceButton = document.querySelector("#buy-pierce")!;
    this.buyLifeButton = document.querySelector("#buy-life")!;
    this.buyPotionButton = document.querySelector("#buy-potion")!;
    this.buyDynamiteButton = document.querySelector("#buy-dynamite")!;
    this.continueButton = document.querySelector("#continue-stage")!;
    this.buyDamageButton.addEventListener("click", () => this.buyShopItem("damage"));
    this.buyRangeButton.addEventListener("click", () => this.buyShopItem("range"));
    this.buyReloadButton.addEventListener("click", () => this.buyShopItem("reload"));
    this.buyPierceButton.addEventListener("click", () => this.buyShopItem("pierce"));
    this.buyLifeButton.addEventListener("click", () => this.buyShopItem("life"));
    this.buyPotionButton.addEventListener("click", () => this.buyShopItem("potion"));
    this.buyDynamiteButton.addEventListener("click", () => this.buyShopItem("dynamite"));
    this.continueButton.addEventListener("click", () => this.leaveShop());
    this.startButton.addEventListener("click", () => this.startGame());
    this.statusText.addEventListener("click", () => {
      if (this.waitingForContinue) this.continueGame();
    });
    this.bindTouchControls();
  }

  private bindTouchControls() {
    const stopTouch = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
      const direction = button.dataset.move!;
      button.addEventListener("pointerdown", (event) => {
        stopTouch(event);
        this.activeTouchMoves.add(direction);
        this.updateTouchMove();
      });
      const release = (event: Event) => {
        stopTouch(event);
        this.activeTouchMoves.delete(direction);
        this.updateTouchMove();
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
    this.touchDynamiteButton.addEventListener("pointerdown", (event) => {
      stopTouch(event);
      this.throwDynamite();
    });
  }

  private updateTouchMove() {
    this.touchMove.x = Number(this.activeTouchMoves.has("right")) - Number(this.activeTouchMoves.has("left"));
    this.touchMove.y = Number(this.activeTouchMoves.has("down")) - Number(this.activeTouchMoves.has("up"));
  }

  private startGame() {
    if (this.gameStarted) return;
    this.gameStarted = true;
    this.introOverlay.classList.add("hidden");
    this.spawnWave();
    this.updateHud(this.stageTitle());
    if (new URLSearchParams(window.location.search).get("shop") === "1") {
      this.gold = Math.max(this.gold, 30);
      this.openShop();
    }
  }

  private applyStartParams() {
    const stage = Number(new URLSearchParams(window.location.search).get("stage"));
    if (Number.isFinite(stage) && stage >= 1) {
      this.wave = Phaser.Math.Clamp(Math.floor(stage), 1, STAGES.length);
    }
  }

  private createWorld() {
    this.clearWorld();
    const theme = this.currentTheme();
    const bg = this.track(this.add.image(480, 270, theme.background));
    bg.setDisplaySize(960, 540);
    bg.setDepth(0);

    const colorWash = this.track(this.add.rectangle(480, 270, 960, 540, theme.skyBottom, theme.wash ?? 0.08));
    colorWash.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const lane = this.track(this.add.graphics());
    lane.fillStyle(0x160d0b, 0.28);
    lane.fillRect(0, 438, 960, 102);
    lane.lineStyle(3, theme.trim, 0.35);
    for (let x = 22; x < 960; x += 58) {
      lane.strokeRect(x, 468, 32, 5);
    }

    this.track(
      this.add
        .text(480, 322, `${String(this.wave).padStart(2, "0")}  ${theme.name}`, {
          color: "#ffe9b0",
          fontFamily: "Georgia, serif",
          fontSize: "18px",
          fontStyle: "bold",
          stroke: "#20100d",
          strokeThickness: 4
        })
        .setOrigin(0.5)
    );

    [
      [104, 418],
      [154, 420],
      [804, 412],
      [852, 420],
      [486, 406],
      [538, 408]
    ].forEach(([x, y], index) => this.createProp(x, y, index));
  }

  private drawMotif(g: Phaser.GameObjects.Graphics, theme: StageTheme) {
    g.fillStyle(0x0d0c0e, 0.28);
    g.fillRect(0, 0, 960, 96);
    if (theme.motif === "desert" || theme.motif === "canyon") {
      g.fillStyle(theme.accent, 0.35);
      for (let x = -80; x < 960; x += 180) this.pixelMesa(g, x, 338, 220, 150, theme.accent);
      g.fillStyle(0x3b2118, 0.24);
      for (let x = 30; x < 960; x += 240) {
        this.pixelRect(g, x, 238, 48, 100);
        this.pixelRect(g, x - 16, 282, 80, 18);
      }
    }
    if (theme.motif === "mine") {
      g.fillStyle(0x171310, 0.72);
      this.pixelMesa(g, 78, 338, 274, 166, 0x171310);
      this.pixelMesa(g, 560, 338, 315, 184, 0x171310);
      g.lineStyle(5, theme.trim, 0.5);
      for (let x = 120; x < 860; x += 80) {
        this.pixelRect(g, x, 306, 56, 8);
        this.pixelRect(g, x + 24, 258, 8, 56);
      }
    }
    if (theme.motif === "rail") {
      g.fillStyle(0x2a1a14, 0.75);
      for (let x = -20; x < 960; x += 32) {
        this.pixelRect(g, x, 390 - Math.floor(x / 44), 42, 8);
        this.pixelRect(g, x, 424 - Math.floor(x / 44), 42, 8);
      }
      for (let x = 0; x < 960; x += 48) this.pixelRect(g, x, 374, 20, 60);
    }
    if (theme.motif === "night") {
      g.fillStyle(0xf7e6aa, 0.9);
      this.pixelRect(g, 788, 48, 48, 48);
      this.pixelRect(g, 800, 36, 24, 72);
      g.fillStyle(0xf7e6aa, 0.6);
      for (let i = 0; i < 28; i += 1) this.pixelRect(g, Phaser.Math.Between(20, 940), Phaser.Math.Between(18, 165), 4, 4);
    }
    if (theme.motif === "river") {
      g.fillStyle(0x3a8e93, 0.75);
      g.fillRect(0, 385, 960, 56);
      g.fillStyle(0xbaf2e6, 0.45);
      for (let x = -20; x < 960; x += 70) {
        this.pixelRect(g, x, 404, 36, 6);
        this.pixelRect(g, x + 28, 396, 32, 6);
      }
    }
    if (theme.motif === "fort") {
      g.fillStyle(0x2b201a, 0.55);
      for (let x = 0; x < 960; x += 42) {
        this.pixelRect(g, x, 185, 28, 153);
        this.pixelRect(g, x + 4, 169, 20, 16);
      }
      this.pixelRect(g, 0, 230, 960, 44);
    }
  }

  private createBuilding(x: number, y: number, w: number, h: number, label: string, color: number, trim: number) {
    const g = this.track(this.add.graphics());
    const dark = Phaser.Display.Color.ValueToColor(color).darken(32).color;
    const light = Phaser.Display.Color.ValueToColor(color).brighten(20).color;
    g.fillStyle(dark, 1);
    this.pixelRect(g, x - 8, y + 16, w + 16, h - 8);
    g.fillStyle(color, 1);
    this.pixelRect(g, x, y, w, h);
    g.fillStyle(light, 1);
    this.pixelRect(g, x + 8, y + 8, w - 16, 14);
    for (let stripeY = y + 46; stripeY < y + h - 12; stripeY += 34) {
      g.fillStyle(dark, 0.28);
      this.pixelRect(g, x + 8, stripeY, w - 16, 8);
    }
    g.fillStyle(0x20100d, 1);
    this.pixelRect(g, x + 20, y + 82, 56, 72);
    this.pixelRect(g, x + w - 76, y + 82, 56, 72);
    g.fillStyle(0xf3cf79, 1);
    this.pixelRect(g, x + 14, y + 28, w - 28, 34);
    g.fillStyle(trim, 1);
    this.pixelRect(g, x + 22, y + 36, w - 44, 18);
    g.fillStyle(0x20100d, 0.25);
    this.pixelRect(g, x + 4, y + h - 12, w - 8, 12);
    this.track(
      this.add
        .text(x + w / 2, y + 45, label, {
          color: "#332019",
          fontFamily: "Courier New, monospace",
          fontSize: "18px",
          fontStyle: "bold"
        })
        .setOrigin(0.5)
    );
  }

  private createPlayer() {
    this.player = this.add.container(480, 442);
    this.player.setDepth(5);
    const shadow = this.add.ellipse(0, 30, 74, 18, 0x000000, 0.32);
    const hero = this.sheetSprite(0, -20, "heroBlue", 104, 112);
    this.player.add([shadow, hero]);
    this.playerBody = this.add.rectangle(480, 442, 48, 88, 0xffffff, 0).setDepth(5);
  }

  private createReticle() {
    this.reticle = this.add.container(480, 260).setDepth(20);
    const ring = this.add.circle(0, 0, 18).setStrokeStyle(2, 0xf7e1a0, 0.9);
    const dot = this.add.circle(0, 0, 3, 0xffffff, 0.95);
    const h = this.add.rectangle(0, 0, 34, 2, 0xf7e1a0, 0.8);
    const v = this.add.rectangle(0, 0, 2, 34, 0xf7e1a0, 0.8);
    this.reticle.add([ring, h, v, dot]);
  }

  private createProp(x: number, y: number, index: number) {
    const c = this.track(this.add.container(x, y).setDepth(2));
    const prop = STAGES[(this.wave - 1) % STAGES.length].prop;
    if (prop === "cactus") {
      c.add(this.sheetSprite(0, -8, "cactus", 62, 96));
    } else if (prop === "crate") {
      c.add(this.sheetSprite(0, 4, "crate", 66, 66));
    } else if (prop === "ore") {
      c.add(this.sheetSprite(0, 4, "brokenCrate", 72, 62));
    } else if (prop === "lantern") {
      c.add(this.sheetSprite(0, -8, "lantern", 48, 92));
    } else {
      c.add(this.sheetSprite(0, 2, "barrel", 58, 74));
    }
    if (index % 2 === 1) c.setScale(0.9);
    const body = this.track(this.add.rectangle(x, y + 14, 54, 58, 0xffffff, 0).setDepth(2));
    this.props.push({ sprite: c, body, hp: 3 });
  }

  private createEnemy(point: SpawnPoint, isBoss = false): Enemy {
    const c = this.add.container(point.x, point.y + 18).setDepth(point.kind === "street" || point.kind === "edge" ? 5 : 4);
    c.setAlpha(0);
    c.setScale(isBoss ? 1.18 : 0.78);
    const shadow = this.add.ellipse(0, isBoss ? 52 : 34, isBoss ? 156 : 76, isBoss ? 32 : 18, 0x000000, 0.3);
    const enemyFrame = this.pickEnemyFrame(isBoss);
    const bossFrame = this.currentTheme().bossSprite;
    const bossMeta = BOSS_SPRITES[bossFrame];
    const bossHeight = 213;
    const bossWidth = Math.round((bossMeta.w / bossMeta.h) * bossHeight);
    const sprite = isBoss
      ? this.bossSprite(0, -58, bossFrame, bossWidth, bossHeight)
      : this.enemySprite(0, -24, enemyFrame, 100, 108);
    c.add([shadow, sprite]);
    const body = this.add.rectangle(point.x, point.y, isBoss ? 90 : 52, isBoss ? 130 : 88, 0xffffff, 0).setDepth(4);
    this.tweens.add({
      targets: c,
      y: point.y,
      alpha: 1,
      scale: 1,
      duration: 210,
      ease: "Back.easeOut"
    });
    return {
      sprite: c,
      body,
      hp: isBoss ? 16 + this.wave * 7 : 1,
      speed: isBoss ? 22 + this.wave * 2 : Phaser.Math.Between(44, 78) + this.wave * 2.6,
      lane: point.y,
      nextShot: this.time.now + Phaser.Math.Between(isBoss ? 950 : 1500, isBoss ? 1800 : 3100),
      nextMove: this.time.now + Phaser.Math.Between(700, 1600),
      minX: isBoss ? 300 : point.minX,
      maxX: isBoss ? 680 : point.maxX,
      direction: point.x < 480 ? 1 : -1,
      coverY: point.y,
      isBoss,
      goldValue: isBoss ? 10 : 1,
      alive: true
    };
  }

  private spawnWave() {
    this.clearCombat();
    this.createWorld();
    if (this.player) {
      this.player.setPosition(480, 442);
      this.playerBody.setPosition(480, 442);
      this.player.setDepth(5);
      this.playerBody.setDepth(5);
      this.reticle.setDepth(20);
    }
    this.nextEnemyShot = this.time.now + 1200;
    this.invulnerableUntil = this.time.now + 2200;
    if (new URLSearchParams(window.location.search).has("stage")) {
      this.invulnerableUntil = this.time.now + 8000;
      this.lives = Math.max(this.lives, this.maxLives);
    }
    this.stageKills = 0;
    this.bossSpawned = false;
    this.killTarget = KILLS_TO_BOSS_BY_STAGE[this.wave - 1] ?? 500;
    this.nextSpawn = this.time.now + 360;
    const count = Math.min(10 + this.wave * 2, 18);
    for (let i = 0; i < count; i += 1) this.spawnEnemy();
  }

  private spawnEnemy() {
    const occupied = new Set(
      this.enemies
        .filter((enemy) => enemy.alive)
        .map((enemy) => Math.round(enemy.coverY / 10) * 10 + ":" + Math.round(enemy.sprite.x / 80))
    );
    const candidates = SPAWN_POINTS.filter((point) => !occupied.has(Math.round(point.y / 10) * 10 + ":" + Math.round(point.x / 80)));
    const point = Phaser.Utils.Array.GetRandom(candidates.length ? candidates : SPAWN_POINTS);
    this.enemies.push(this.createEnemy(point));
  }

  private spawnBoss() {
    this.bossSpawned = true;
    const point: SpawnPoint = { x: 480, y: 286, minX: 300, maxX: 680, kind: "street" };
    const boss = this.createEnemy(point, true);
    this.enemies.push(boss);
    this.updateHud(`BOSS: ${this.currentTheme().bossName ?? "Outlaw"}`);
  }

  private handleInput(delta: number) {
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchMove.x < 0;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchMove.x > 0;
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.touchMove.y < 0;
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.touchMove.y > 0;
    const speed = 305 * (delta / 1000);
    let x = this.player.x;
    let y = this.player.y;
    if (left) x -= speed;
    if (right) x += speed;
    if (up) y -= speed * 0.45;
    if (down) y += speed * 0.45;
    x = Phaser.Math.Clamp(x, 64, 896);
    y = Phaser.Math.Clamp(y, 408, 480);
    this.player.setPosition(x, y);
    this.playerBody.setPosition(x, y);
    this.player.setScale(this.reticle.x >= this.player.x ? 1 : -1, 1);
  }

  private shoot() {
    if (this.isGameOver || this.inShop || this.time.now < this.nextPlayerShot) return;
    const weapon = this.weaponStats();
    this.nextPlayerShot = this.time.now + weapon.delay;
    if (this.weapon === "gatling") {
      this.gatlingAmmo -= 1;
      if (this.gatlingAmmo <= 0) {
        this.weapon = "pistol";
        this.gatlingAmmo = 0;
        this.updateHud("GATLING EMPTY");
      }
    }
    const start = new Phaser.Math.Vector2(this.player.x, this.player.y - 18);
    const target = new Phaser.Math.Vector2(this.reticle.x, this.reticle.y);
    const direction = target.subtract(start).normalize();
    this.cameras.main.shake(weapon.shake, 0.0025);
    this.flash(start.x + direction.x * 34, start.y + direction.y * 34, 0xfff0a8);
    this.impactAt(this.reticle.x, this.reticle.y);
    this.hitScanAt(this.reticle.x, this.reticle.y, weapon.damage, weapon.radius, weapon.pierce);
    if (weapon.extraHits > 0) {
      this.hitScanAt(this.reticle.x - weapon.radius * 0.9, this.reticle.y, weapon.damage, weapon.radius, weapon.pierce);
      this.hitScanAt(this.reticle.x + weapon.radius * 0.9, this.reticle.y, weapon.damage, weapon.radius, weapon.pierce);
    }
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, fromPlayer: boolean) {
    const sprite = this.add.circle(x, y, fromPlayer ? 5 : 6, fromPlayer ? 0xfff2a8 : 0xff6959, 1).setDepth(10);
    sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.bullets.push({ sprite, vx, vy, fromPlayer, life: 900 });
  }

  private updateEnemies(time: number, delta: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (time > enemy.nextMove) {
        enemy.direction = Math.random() > 0.5 ? 1 : -1;
        enemy.nextMove = time + Phaser.Math.Between(650, 1550);
      }
      enemy.sprite.x += enemy.direction * enemy.speed * (delta / 1000);
      if (enemy.sprite.x <= enemy.minX || enemy.sprite.x >= enemy.maxX) {
        enemy.direction *= -1;
      }
      enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x, enemy.minX, enemy.maxX);
      enemy.sprite.y = enemy.coverY + Math.sin((time + enemy.lane * 7) / 360) * 2.2;
      enemy.body.setPosition(enemy.sprite.x, enemy.sprite.y);
      enemy.sprite.setScale(enemy.sprite.x < this.player.x ? 1 : -1, 1);

      if (
        time > enemy.nextShot &&
        time > this.nextEnemyShot &&
        Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y) < 640
      ) {
        const start = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y - 18);
        const target = new Phaser.Math.Vector2(this.player.x, this.player.y - 14);
        const direction = target.subtract(start).normalize();
        this.tweens.add({
          targets: enemy.sprite,
          y: enemy.sprite.y - 10,
          yoyo: true,
          duration: 95,
          ease: "Quad.easeOut"
        });
        const bulletSpeed = enemy.isBoss ? 285 + this.wave * 8 : 245 + this.wave * 6;
        this.spawnBullet(start.x, start.y, direction.x * bulletSpeed, direction.y * bulletSpeed, false);
        this.flash(start.x + direction.x * 24, start.y + direction.y * 24, enemy.isBoss ? 0xffd24c : 0xff6048);
        enemy.nextShot = time + Phaser.Math.Between(enemy.isBoss ? 1250 : 1700, enemy.isBoss ? 2100 : 3300);
        this.nextEnemyShot = time + (enemy.isBoss ? 240 : 360);
      }
    }
  }

  private updateBullets(delta: number) {
    for (const bullet of [...this.bullets]) {
      bullet.sprite.x += bullet.vx * (delta / 1000);
      bullet.sprite.y += bullet.vy * (delta / 1000);
      bullet.life -= delta;
      if (bullet.fromPlayer) {
        if (this.hitEnemies(bullet)) continue;
        this.hitProps(bullet);
      } else {
        if (this.hitProps(bullet)) continue;
        if (this.rectangleHit(bullet.sprite, this.playerBody) && this.time.now > this.invulnerableUntil) {
          this.destroyBullet(bullet);
          this.damagePlayer();
        }
      }
      if (bullet.life <= 0 || bullet.sprite.x < -24 || bullet.sprite.x > 984 || bullet.sprite.y < -24 || bullet.sprite.y > 564) this.destroyBullet(bullet);
    }
  }

  private hitEnemies(bullet: Bullet) {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !this.rectangleHit(bullet.sprite, enemy.body)) continue;
      this.destroyBullet(bullet);
      this.damageEnemy(enemy, 1);
      return true;
    }
    return false;
  }

  private hitProps(bullet: Bullet) {
    for (const prop of [...this.props]) {
      if (!this.rectangleHit(bullet.sprite, prop.body)) continue;
      this.destroyBullet(bullet);
      this.damageProp(prop);
      return true;
    }
    return false;
  }

  private hitScanAt(x: number, y: number, damage: number, radius: number, pierce = 0) {
    const shotLine = new Phaser.Geom.Line(this.player.x, this.player.y - 18, x, y);
    const blocker = this.firstPropOnLine(shotLine);
    if (blocker) {
      this.damageProp(blocker);
      return;
    }

    const hitArea = new Phaser.Geom.Rectangle(x - radius, y - radius, radius * 2, radius * 2);

    const targets = this.enemies
      .filter((enemy) => enemy.alive && Phaser.Geom.Intersects.RectangleToRectangle(hitArea, enemy.body.getBounds()))
      .sort((a, b) => Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(x, y, b.sprite.x, b.sprite.y));
    if (targets.length > 0) {
      for (const enemy of targets.slice(0, pierce + 1)) {
        this.damageEnemy(enemy, damage);
      }
      return;
    }

    for (const prop of [...this.props]) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(hitArea, prop.body.getBounds())) continue;
      this.damageProp(prop);
      return;
    }
  }

  private firstPropOnLine(line: Phaser.Geom.Line) {
    let closest: Prop | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const prop of this.props) {
      const bounds = prop.body.getBounds();
      if (!Phaser.Geom.Intersects.LineToRectangle(line, bounds)) continue;
      const distance = Phaser.Math.Distance.Between(line.x1, line.y1, prop.body.x, prop.body.y);
      if (distance < closestDistance) {
        closest = prop;
        closestDistance = distance;
      }
    }
    return closest;
  }

  private damageProp(prop: Prop) {
    prop.hp -= 1;
    prop.sprite.angle += Phaser.Math.Between(-8, 8);
    this.flash(prop.sprite.x, prop.sprite.y, 0xffd37a);
    if (prop.hp <= 0) {
      this.score += 50;
      this.explode(prop.sprite.x, prop.sprite.y + 16);
      prop.sprite.destroy();
      prop.body.destroy();
      this.props = this.props.filter((item) => item !== prop);
      this.updateHud("BREAK!");
    }
  }

  private damageEnemy(enemy: Enemy, damage: number) {
    enemy.hp -= damage;
    this.flash(enemy.sprite.x, enemy.sprite.y - 20, 0xfff0a8);
    this.tintContainer(enemy.sprite, 0xffe0a0);
    this.time.delayedCall(70, () => this.clearContainerTint(enemy.sprite));
    if (enemy.hp > 0) {
      if (enemy.isBoss) this.pop(enemy.sprite.x, enemy.sprite.y - 82, `${enemy.hp}`);
      return;
    }

    enemy.alive = false;
    this.combo += 1;
    this.score += enemy.isBoss ? 1000 + this.wave * 250 : 80 * this.combo;
    this.gold += enemy.goldValue;
    if (!enemy.isBoss) {
      this.stageKills += 1;
      if (this.stageKills < this.killTarget && this.stageKills % 50 === 0) {
        this.updateHud(`KILLS ${this.stageKills}/${this.killTarget}`);
      }
    }
    this.pop(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? `+${enemy.goldValue}G BOSS` : "+1G");
    this.explode(enemy.sprite.x, enemy.sprite.y);
    enemy.sprite.destroy();
    enemy.body.destroy();
    this.updateHud();

    if (enemy.isBoss) this.finishStage();
  }

  private advanceStage() {
    if (this.wave >= STAGES.length) {
      this.isGameOver = true;
      this.updateHud("CLEAR! R TO RESTART");
      this.statusText.classList.add("large");
      return;
    }
    this.wave += 1;
    this.combo = 0;
    this.spawnWave();
    this.updateHud(this.stageTitle());
  }

  private finishStage() {
    this.clearCombat();
    if (this.wave >= STAGES.length) {
      this.isGameOver = true;
      this.updateHud("CLEAR! R TO RESTART");
      this.statusText.classList.add("large");
      return;
    }
    this.openShop();
  }

  private openShop() {
    this.inShop = true;
    this.shopOverlay.classList.remove("hidden");
    this.shopTitle.textContent = `GUNSMITH - STAGE ${this.wave} CLEAR`;
    this.updateShop();
  }

  private leaveShop() {
    if (!this.inShop) return;
    this.inShop = false;
    this.shopOverlay.classList.add("hidden");
    this.wave += 1;
    this.combo = 0;
    this.spawnWave();
    this.updateHud(this.stageTitle());
  }

  private buyShopItem(kind: "damage" | "range" | "reload" | "pierce" | "life" | "potion" | "dynamite") {
    const cost = kind === "potion" ? 4 : kind === "dynamite" ? 6 : this.upgradeCost(kind);
    if (kind !== "potion" && kind !== "dynamite" && this.upgradeLevel(kind) >= this.upgradeMax(kind)) {
      this.updateHud("ALREADY MAXED");
      return;
    }
    if (kind === "dynamite" && this.dynamite >= 3) {
      this.updateHud("DYNAMITE FULL");
      return;
    }
    if (this.gold < cost) {
      this.updateHud("NOT ENOUGH GOLD");
      return;
    }
    this.gold -= cost;
    if (kind === "damage") {
      this.gunDamageLevel += 1;
    } else if (kind === "range") {
      this.gunRangeLevel += 1;
    } else if (kind === "reload") {
      this.gunReloadLevel += 1;
    } else if (kind === "pierce") {
      this.gunPierceLevel += 1;
    } else if (kind === "life") {
      this.maxLifeLevel += 1;
      this.maxLives += 1;
      this.lives = this.maxLives;
    } else if (kind === "potion") {
      this.lives = Math.min(this.maxLives, this.lives + 2);
    } else if (kind === "dynamite") {
      this.dynamite += 1;
    }
    this.updateHud(kind === "potion" || kind === "dynamite" ? "SOLD" : "GUN MODDED");
    this.updateShop();
  }

  private updateShop() {
    this.shopGoldText.textContent = `Gold ${this.gold} | Revolver DMG ${this.gunDamageLevel} RNG ${this.gunRangeLevel} REL ${this.gunReloadLevel} PRC ${this.gunPierceLevel} | Life ${this.lives}/${this.maxLives}`;
    this.buyDamageButton.innerHTML = this.upgradeHtml("shotgun", "Powder", "damage", `Damage +1`);
    this.buyRangeButton.innerHTML = this.upgradeHtml("rifle", "Long Barrel", "range", `Hit range +10`);
    this.buyReloadButton.innerHTML = this.upgradeHtml("gatling", "Quick Trigger", "reload", `Reload -32ms`);
    this.buyPierceButton.innerHTML = this.upgradeHtml("rifle", "Piercer", "pierce", `Hit +1 target`);
    this.buyLifeButton.innerHTML = this.upgradeHtml("potion", "Iron Heart", "life", `Max life +1`);
    this.buyPotionButton.innerHTML = `<i class="item-icon potion"></i><span>Healing Potion</span><small>4G | Restore 2 hearts</small>`;
    this.buyDynamiteButton.innerHTML = `<i class="item-icon dynamite"></i><span>Dynamite</span><small>6G | Clear screen, max 3</small>`;
    this.buyDamageButton.disabled = this.gunDamageLevel >= this.upgradeMax("damage");
    this.buyRangeButton.disabled = this.gunRangeLevel >= this.upgradeMax("range");
    this.buyReloadButton.disabled = this.gunReloadLevel >= this.upgradeMax("reload");
    this.buyPierceButton.disabled = this.gunPierceLevel >= this.upgradeMax("pierce");
    this.buyLifeButton.disabled = this.maxLifeLevel >= this.upgradeMax("life");
    this.buyPotionButton.disabled = this.lives >= this.maxLives;
    this.buyDynamiteButton.disabled = this.dynamite >= 3;
  }

  private upgradeLevel(kind: "damage" | "range" | "reload" | "pierce" | "life") {
    if (kind === "damage") return this.gunDamageLevel;
    if (kind === "range") return this.gunRangeLevel;
    if (kind === "reload") return this.gunReloadLevel;
    if (kind === "pierce") return this.gunPierceLevel;
    return this.maxLifeLevel;
  }

  private upgradeMax(kind: "damage" | "range" | "reload" | "pierce" | "life") {
    if (kind === "pierce") return 3;
    if (kind === "life") return 4;
    return 5;
  }

  private upgradeCost(kind: "damage" | "range" | "reload" | "pierce" | "life") {
    const level = this.upgradeLevel(kind);
    const base = { damage: 6, range: 5, reload: 7, pierce: 10, life: 8 }[kind];
    return base + level * (kind === "pierce" ? 10 : kind === "life" ? 8 : 6);
  }

  private upgradeHtml(icon: string, label: string, kind: "damage" | "range" | "reload" | "pierce" | "life", detail: string) {
    const level = this.upgradeLevel(kind);
    const max = this.upgradeMax(kind);
    const price = level >= max ? "MAX" : `${this.upgradeCost(kind)}G`;
    return `<i class="item-icon ${icon}"></i><span>${label} ${level}/${max}</span><small>${price} | ${detail}</small>`;
  }

  private weaponStats() {
    return {
      damage: 1 + this.gunDamageLevel,
      radius: 28 + this.gunRangeLevel * 10,
      delay: Math.max(90, 210 - this.gunReloadLevel * 32),
      extraHits: 0,
      pierce: this.gunPierceLevel,
      shake: Math.max(18, 45 - this.gunReloadLevel * 3)
    };
  }

  private throwDynamite() {
    if (this.isGameOver || this.inShop || this.dynamite <= 0) {
      if (!this.inShop && this.dynamite <= 0) this.updateHud("NO DYNAMITE");
      return;
    }
    this.dynamite -= 1;
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    for (const enemy of liveEnemies) {
      this.damageEnemy(enemy, 999);
    }
    this.cameras.main.shake(420, 0.018);
    this.updateHud("DYNAMITE!");
  }

  private damagePlayer() {
    this.lives -= 1;
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 2100;
    this.player.setAlpha(0.45);
    this.cameras.main.shake(220, 0.01);
    this.time.delayedCall(2100, () => this.player.setAlpha(1));
    if (this.lives <= 0) {
      this.offerContinue();
    } else {
      this.updateHud("HIT!");
    }
  }

  private offerContinue() {
    this.isGameOver = true;
    this.waitingForContinue = this.continuesLeft > 0;
    this.statusText.classList.add("large");
    if (this.waitingForContinue) {
      this.updateHud(`TO BE CONTINUED? ${this.continuesLeft} LEFT - ENTER/TAP`);
    } else {
      this.updateHud("GAME OVER - R TO RESTART");
    }
  }

  private continueGame() {
    if (!this.waitingForContinue || this.continuesLeft <= 0) return;
    this.continuesLeft -= 1;
    this.isGameOver = false;
    this.waitingForContinue = false;
    this.lives = this.maxLives;
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 3200;
    this.player.setAlpha(1);
    for (const bullet of [...this.bullets]) this.destroyBullet(bullet);
    this.player.setPosition(480, 442);
    this.playerBody.setPosition(480, 442);
    this.statusText.classList.remove("large");
    this.updateHud(`CONTINUE! ${this.continuesLeft} LEFT`);
  }

  private rectangleHit(circle: Phaser.GameObjects.Arc, rect: Phaser.GameObjects.Rectangle) {
    return Phaser.Geom.Intersects.RectangleToRectangle(circle.getBounds(), rect.getBounds());
  }

  private destroyBullet(bullet: Bullet) {
    if (!this.bullets.includes(bullet)) return;
    bullet.sprite.destroy();
    this.bullets = this.bullets.filter((item) => item !== bullet);
  }

  private tintContainer(container: Phaser.GameObjects.Container, color: number) {
    container.each((child: Phaser.GameObjects.GameObject) => {
      const tintable = child as Phaser.GameObjects.GameObject & { setTint?: (value: number) => void };
      tintable.setTint?.(color);
    });
  }

  private clearContainerTint(container: Phaser.GameObjects.Container) {
    if (!container.active) return;
    container.each((child: Phaser.GameObjects.GameObject) => {
      const tintable = child as Phaser.GameObjects.GameObject & { clearTint?: () => void };
      tintable.clearTint?.();
    });
  }

  private flash(x: number, y: number, color: number) {
    const spark = this.sheetSprite(x, y, color === 0xff6048 ? "smallMuzzle" : "muzzle", 74, 42)
      .setDepth(12)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: spark, scale: 1.35, alpha: 0, duration: 130, onComplete: () => spark.destroy() });
  }

  private impactAt(x: number, y: number) {
    const ring = this.add.circle(x, y, 10).setStrokeStyle(3, 0xfff0a8, 0.95).setDepth(13);
    const core = this.add.circle(x, y, 5, 0xffffff, 0.9).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
    const slashH = this.add.rectangle(x, y, 36, 3, 0xffc45f, 0.9).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
    const slashV = this.add.rectangle(x, y, 3, 36, 0xffc45f, 0.9).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [ring, core, slashH, slashV],
      scale: 1.8,
      alpha: 0,
      duration: 150,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ring.destroy();
        core.destroy();
        slashH.destroy();
        slashV.destroy();
      }
    });
  }

  private explode(x: number, y: number) {
    const boom = this.sheetSprite(x, y, "explosion", 124, 116).setDepth(11).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: boom,
      scale: 1.22,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => boom.destroy()
    });
  }

  private pop(x: number, y: number, text: string) {
    const label = this.add
      .text(x, y - 50, text, {
        color: "#ffe6a3",
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#2a1711",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({ targets: label, y: label.y - 34, alpha: 0, duration: 650, onComplete: () => label.destroy() });
  }

  private updateHud(status?: string) {
    this.scoreText.textContent = String(this.score);
    this.waveText.textContent = String(this.wave);
    this.livesText.textContent = `${this.lives}/${this.maxLives}`;
    this.goldText.textContent = String(this.gold);
    this.comboText.textContent = this.bossSpawned ? "BOSS" : `${this.stageKills}/${this.killTarget}`;
    if (this.inShop) this.updateShop();
    if (status) {
      this.statusText.textContent = status;
      this.statusText.classList.add("show");
      this.time.delayedCall(980, () => {
        if (!this.isGameOver) this.statusText.classList.remove("show");
      });
    }
  }

  private stageTitle() {
    return `STAGE ${this.wave}: ${this.currentTheme().name}`;
  }

  private currentTheme() {
    return STAGES[(this.wave - 1) % STAGES.length];
  }

  private registerSpriteFrames() {
    const texture = this.textures.get("mvpSprites");
    for (const [name, frame] of Object.entries(SPRITES)) {
      if (!texture.has(name)) {
        texture.add(name, 0, frame.x, frame.y, frame.w, frame.h);
      }
    }
    for (const [name, frame] of Object.entries(ENEMY_SPRITES)) {
      const enemyTexture = this.textures.get(frame.texture);
      if (!enemyTexture.has(name)) {
        enemyTexture.add(name, 0, frame.x, frame.y, frame.w, frame.h);
      }
    }
    for (const [name, frame] of Object.entries(BOSS_SPRITES)) {
      const bossTexture = this.textures.get(frame.texture);
      if (!bossTexture.has(name)) {
        bossTexture.add(name, 0, frame.x, frame.y, frame.w, frame.h);
      }
    }
  }

  private sheetSprite(x: number, y: number, frameName: keyof typeof SPRITES, displayW: number, displayH: number) {
    const sprite = this.add.image(x, y, "mvpSprites", frameName);
    sprite.setDisplaySize(displayW, displayH);
    return sprite;
  }

  private enemySprite(x: number, y: number, frameName: keyof typeof ENEMY_SPRITES, displayW: number, displayH: number) {
    const sprite = this.add.image(x, y, ENEMY_SPRITES[frameName].texture, frameName);
    sprite.setDisplaySize(displayW, displayH);
    return sprite;
  }

  private bossSprite(x: number, y: number, frameName: keyof typeof BOSS_SPRITES, displayW: number, displayH: number) {
    const sprite = this.add.image(x, y, BOSS_SPRITES[frameName].texture, frameName);
    sprite.setDisplaySize(displayW, displayH);
    return sprite;
  }

  private pickEnemyFrame(isBoss: boolean) {
    const theme = this.currentTheme();
    return (isBoss
      ? theme.bossEnemy
      : Phaser.Utils.Array.GetRandom(theme.enemyPool)) as keyof typeof ENEMY_SPRITES;
  }

  private pixelRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  private pixelMesa(g: Phaser.GameObjects.Graphics, x: number, baseY: number, width: number, height: number, color: number) {
    const rows = Math.ceil(height / 12);
    for (let row = 0; row < rows; row += 1) {
      const inset = Math.floor((row / rows) * width * 0.38 / 8) * 8;
      const y = baseY - row * 12;
      const shade = Phaser.Display.Color.ValueToColor(color).darken(row * 1.4).color;
      g.fillStyle(shade, 0.72);
      this.pixelRect(g, x + inset, y, width - inset * 2, 12);
    }
  }

  private drawPixelNoise(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha: number,
    step: number
  ) {
    g.fillStyle(color, alpha);
    for (let px = x; px < x + w; px += step) {
      for (let py = y; py < y + h; py += step) {
        const shouldDraw = (px * 17 + py * 31 + this.wave * 47) % 5 === 0;
        if (shouldDraw) this.pixelRect(g, px, py, step / 2, step / 2);
      }
    }
  }

  private clearCombat() {
    this.enemies.forEach((enemy) => {
      enemy.sprite.destroy();
      enemy.body.destroy();
    });
    this.bullets.forEach((bullet) => bullet.sprite.destroy());
    this.enemies = [];
    this.bullets = [];
  }

  private clearWorld() {
    this.props = [];
    this.worldObjects.forEach((object) => object.destroy());
    this.worldObjects = [];
  }

  private track<T extends Phaser.GameObjects.GameObject>(object: T) {
    (object as unknown as { setDepth: (depth: number) => T }).setDepth(1);
    this.worldObjects.push(object);
    return object;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#191310",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MumuBrothersScene]
};

createShell();
new Phaser.Game(config);
