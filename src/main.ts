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
              <button id="buy-shotgun" type="button"><i class="item-icon shotgun"></i><span>Double Barrel</span><small>Wide x2 / Damage x2 / Slower</small></button>
              <button id="buy-rifle" type="button"><i class="item-icon rifle"></i><span>Long Rifle</span><small>Damage x3 / Precise</small></button>
              <button id="buy-gatling" type="button"><i class="item-icon gatling"></i><span>Gatling</span><small>1000 rounds / then pistol</small></button>
              <button id="buy-potion" type="button"><i class="item-icon potion"></i><span>Healing Potion</span><small>Restore 2 hearts</small></button>
              <button id="buy-dynamite" type="button"><i class="item-icon dynamite"></i><span>Dynamite</span><small>Clear screen / Max 3</small></button>
            </div>
            <button id="continue-stage" class="continue" type="button">Next Stage</button>
          </div>
        </div>
      </section>
      <aside class="panel">
        <h1>Mumu Brothers</h1>
        <p>5-stage boss rush frontier shooter</p>
        <div class="controls">
          <span>A/D or arrows</span><b>move</b>
          <span>Mouse</span><b>aim</b>
          <span>Click or Z/X/C/Space</span><b>fire</b>
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
  demonOutlaw: { texture: "enemyTypes3", x: 603, y: 28, w: 330, h: 456 }
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

const KILLS_TO_BOSS_BY_STAGE = [50, 100, 200, 300, 500];

const STAGES: StageTheme[] = [
  { name: "Dustbell Main", skyTop: 0x35201a, skyBottom: 0xb86b32, ground: 0xb36c32, trim: 0xf2c66b, accent: 0xa7472e, signs: ["SALOON", "BANK", "HOTEL"], prop: "barrel", motif: "town", bossName: "Marshal Bragg", enemyTint: 0xffffff, bossTint: 0xffc45f, wash: 0.03, background: "stageBackground1", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff" },
  { name: "Red Mesa", skyTop: 0x45251e, skyBottom: 0xd0843e, ground: 0xc96f35, trim: 0xf4c96e, accent: 0xb74b2d, signs: ["DEPOT", "JAIL", "STORE"], prop: "cactus", motif: "desert", bossName: "Cactus Jack", enemyTint: 0xffffff, bossTint: 0x9cff73, wash: 0.04, background: "stageBackground2", enemyPool: ["cactusMutant", "scorpionBandit", "dynamiteThrower"], bossEnemy: "cactusMutant" },
  { name: "Coyote Rail", skyTop: 0x26314a, skyBottom: 0xb66537, ground: 0x9f6633, trim: 0xd9b15a, accent: 0x4e684d, signs: ["STATION", "CARGO", "WATER"], prop: "crate", motif: "rail", bossName: "Iron Belle", enemyTint: 0xffffff, bossTint: 0x82a8ff, wash: 0.05, background: "stageBackground3", enemyPool: ["trainRobber", "rifleDesperado", "dynamiteThrower"], bossEnemy: "armoredSheriff" },
  { name: "Black Spur Mine", skyTop: 0x17191f, skyBottom: 0x6b4b36, ground: 0x71543e, trim: 0xcaa45c, accent: 0x385d4f, signs: ["MINE", "ASSAY", "TOOLS"], prop: "ore", motif: "mine", bossName: "Coal Baron", enemyTint: 0xffffff, bossTint: 0xff7777, wash: 0.07, background: "stageBackground4", enemyPool: ["ghostMiner", "trainRobber", "armoredSheriff"], bossEnemy: "ghostMiner" },
  { name: "Boss Town", skyTop: 0x120e16, skyBottom: 0x5a2532, ground: 0x5e3732, trim: 0xffcc6d, accent: 0x9f2525, signs: ["BOSS", "BLOOD", "END"], prop: "lantern", motif: "fort", bossName: "The Last Brother", enemyTint: 0xffffff, bossTint: 0xff3c3c, wash: 0.06, background: "stageBackground5", enemyPool: ["vampireCowboy", "demonOutlaw", "armoredSheriff"], bossEnemy: "demonOutlaw" }
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
  private wave = 1;
  private combo = 0;
  private stageKills = 0;
  private killTarget = 12;
  private bossSpawned = false;
  private inShop = false;
  private weapon: WeaponKind = "pistol";
  private gatlingAmmo = 0;
  private dynamite = 0;
  private isPointerDown = false;
  private nextPlayerShot = 0;
  private nextEnemyShot = 0;
  private nextSpawn = 0;
  private invulnerableUntil = 0;
  private scoreText!: HTMLElement;
  private waveText!: HTMLElement;
  private livesText!: HTMLElement;
  private goldText!: HTMLElement;
  private comboText!: HTMLElement;
  private statusText!: HTMLElement;
  private shopOverlay!: HTMLElement;
  private shopTitle!: HTMLElement;
  private shopGoldText!: HTMLElement;
  private buyShotgunButton!: HTMLButtonElement;
  private buyRifleButton!: HTMLButtonElement;
  private buyGatlingButton!: HTMLButtonElement;
  private buyPotionButton!: HTMLButtonElement;
  private buyDynamiteButton!: HTMLButtonElement;
  private continueButton!: HTMLButtonElement;
  private isGameOver = false;

  constructor() {
    super("mumu-brothers");
  }

  preload() {
    this.load.image("stageBackground1", "/assets/mvp-background.png");
    this.load.image("stageBackground2", "/assets/stage-2-red-mesa.png");
    this.load.image("stageBackground3", "/assets/stage-3-coyote-rail.png");
    this.load.image("stageBackground4", "/assets/stage-4-black-spur-mine.png");
    this.load.image("stageBackground5", "/assets/stage-5-boss-town.png");
    this.load.image("mvpSprites", "/assets/mvp-sprites.png");
    this.load.image("enemyTypes1", "/assets/enemy-types-1.png");
    this.load.image("enemyTypes2", "/assets/enemy-types-2.png");
    this.load.image("enemyTypes3", "/assets/enemy-types-3.png");
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
      this.isPointerDown = true;
      this.reticle.setPosition(pointer.x, pointer.y);
      this.shoot();
    });
    this.input.on("pointerup", () => {
      this.isPointerDown = false;
    });
    this.spawnWave();
    this.updateHud(this.stageTitle());
    if (new URLSearchParams(window.location.search).get("shop") === "1") {
      this.gold = Math.max(this.gold, 30);
      this.openShop();
    }
  }

  update(time: number, delta: number) {
    if (this.inShop) return;

    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
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
    if (this.weapon === "gatling" && this.isPointerDown) this.shoot();
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
    this.buyShotgunButton = document.querySelector("#buy-shotgun")!;
    this.buyRifleButton = document.querySelector("#buy-rifle")!;
    this.buyGatlingButton = document.querySelector("#buy-gatling")!;
    this.buyPotionButton = document.querySelector("#buy-potion")!;
    this.buyDynamiteButton = document.querySelector("#buy-dynamite")!;
    this.continueButton = document.querySelector("#continue-stage")!;
    this.buyShotgunButton.addEventListener("click", () => this.buyShopItem("shotgun"));
    this.buyRifleButton.addEventListener("click", () => this.buyShopItem("rifle"));
    this.buyGatlingButton.addEventListener("click", () => this.buyShopItem("gatling"));
    this.buyPotionButton.addEventListener("click", () => this.buyShopItem("potion"));
    this.buyDynamiteButton.addEventListener("click", () => this.buyShopItem("dynamite"));
    this.continueButton.addEventListener("click", () => this.leaveShop());
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
    const shadow = this.add.ellipse(0, isBoss ? 46 : 34, isBoss ? 132 : 76, isBoss ? 26 : 18, 0x000000, 0.3);
    const enemyFrame = this.pickEnemyFrame(isBoss);
    const sprite = this.enemySprite(0, isBoss ? -34 : -24, enemyFrame, isBoss ? 172 : 100, isBoss ? 150 : 108);
    c.add([shadow, sprite]);
    const body = this.add.rectangle(point.x, point.y, isBoss ? 96 : 52, isBoss ? 132 : 88, 0xffffff, 0).setDepth(4);
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
      this.lives = Math.max(this.lives, 5);
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
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
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
    this.hitScanAt(this.reticle.x, this.reticle.y, weapon.damage, weapon.radius);
    if (weapon.extraHits > 0) {
      this.hitScanAt(this.reticle.x - weapon.radius * 0.9, this.reticle.y, weapon.damage, weapon.radius);
      this.hitScanAt(this.reticle.x + weapon.radius * 0.9, this.reticle.y, weapon.damage, weapon.radius);
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

  private hitScanAt(x: number, y: number, damage: number, radius: number) {
    const shotLine = new Phaser.Geom.Line(this.player.x, this.player.y - 18, x, y);
    const blocker = this.firstPropOnLine(shotLine);
    if (blocker) {
      this.damageProp(blocker);
      return;
    }

    const hitArea = new Phaser.Geom.Rectangle(x - radius, y - radius, radius * 2, radius * 2);

    for (const enemy of this.enemies) {
      if (!enemy.alive || !Phaser.Geom.Intersects.RectangleToRectangle(hitArea, enemy.body.getBounds())) continue;
      this.damageEnemy(enemy, damage);
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
    this.shopTitle.textContent = `SHOP - STAGE ${this.wave} CLEAR`;
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

  private buyShopItem(kind: "shotgun" | "rifle" | "gatling" | "potion" | "dynamite") {
    const costs = { shotgun: 8, rifle: 10, gatling: 14, potion: 4, dynamite: 6 };
    const cost = costs[kind];
    if (kind === "dynamite" && this.dynamite >= 3) {
      this.updateHud("DYNAMITE FULL");
      return;
    }
    if (this.gold < cost) {
      this.updateHud("NOT ENOUGH GOLD");
      return;
    }
    this.gold -= cost;
    if (kind === "shotgun" || kind === "rifle") {
      this.weapon = kind;
      this.gatlingAmmo = 0;
    } else if (kind === "gatling") {
      this.weapon = "gatling";
      this.gatlingAmmo = 1000;
    } else if (kind === "potion") {
      this.lives = Math.min(5, this.lives + 2);
    } else if (kind === "dynamite") {
      this.dynamite += 1;
    }
    this.updateHud("SOLD");
    this.updateShop();
  }

  private updateShop() {
    const ammo = this.weapon === "gatling" ? ` | Gatling ${this.gatlingAmmo}` : "";
    this.shopGoldText.textContent = `Gold ${this.gold} | Weapon ${this.weapon.toUpperCase()}${ammo} | Dynamite ${this.dynamite}/3`;
    this.buyShotgunButton.innerHTML = `<i class="item-icon shotgun"></i><span>Double Barrel</span><small>8G | Wide x2, damage x2, 1.5x slower</small>`;
    this.buyRifleButton.innerHTML = `<i class="item-icon rifle"></i><span>Long Rifle</span><small>10G | Damage x3, precise shot</small>`;
    this.buyGatlingButton.innerHTML = `<i class="item-icon gatling"></i><span>Gatling</span><small>14G | 1000 rapid rounds, then pistol</small>`;
    this.buyPotionButton.innerHTML = `<i class="item-icon potion"></i><span>Healing Potion</span><small>4G | Restore 2 hearts</small>`;
    this.buyDynamiteButton.innerHTML = `<i class="item-icon dynamite"></i><span>Dynamite</span><small>6G | Clear screen, max 3</small>`;
    this.buyDynamiteButton.disabled = this.dynamite >= 3;
  }

  private weaponStats() {
    if (this.weapon === "shotgun") return { damage: 2, radius: 56, delay: 315, extraHits: 1, shake: 70 };
    if (this.weapon === "rifle") return { damage: 3, radius: 24, delay: 290, extraHits: 0, shake: 55 };
    if (this.weapon === "gatling") return { damage: 1, radius: 26, delay: 48, extraHits: 0, shake: 18 };
    return { damage: 1, radius: 28, delay: 210, extraHits: 0, shake: 45 };
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
      this.isGameOver = true;
      this.updateHud("GAME OVER - R TO RESTART");
      this.statusText.classList.add("large");
    } else {
      this.updateHud("HIT!");
    }
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
    this.livesText.textContent = String(this.lives);
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
