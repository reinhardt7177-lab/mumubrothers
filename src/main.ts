import Phaser from "phaser";
import "./styles.css";

function createShell() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="shell">
      <section class="stage-wrap">
        <div id="game" class="game"></div>
        <div class="hud">
          <div class="hud-meta">
            <div class="hud-stat"><span>SCORE</span><strong id="score">0</strong></div>
            <div class="hud-stat hud-gold"><span>GOLD</span><strong id="gold">0</strong></div>
          </div>
          <div class="hud-progress">
            <div class="stage-line">
              <span class="stage-badge">STAGE <strong id="wave">1</strong></span>
              <strong id="stage-name" class="stage-name">Dustbell Main</strong>
              <span id="wave-phase" class="wave-phase">I / SCOUT</span>
            </div>
            <div class="kill-track" aria-label="Boss progress">
              <i id="kill-progress"></i>
              <b class="kill-mark mark-25"></b>
              <b class="kill-mark mark-50"></b>
              <b class="kill-mark mark-75"></b>
            </div>
            <div class="progress-line">
              <strong id="boss-distance">BOSS IN 100</strong>
              <span id="combo">0 / 100</span>
            </div>
          </div>
          <div class="hud-vitals">
            <div class="hud-stat hud-lives"><span>GRIT</span><strong id="lives">5/5</strong></div>
            <div class="hud-stat hud-bombs"><span>TNT</span><strong id="dynamite-count">0</strong></div>
          </div>
        </div>
        <div id="kill-streak" class="kill-streak">DEADEYE <strong>x0</strong></div>
        <button id="brother-tag" class="brother-hud" type="button" aria-label="Swap brother">
          <span id="brother-name">BLUE / DEADEYE</span>
          <i class="tag-track"><b id="tag-progress"></b></i>
          <small id="weapon-name">PEACEMAKER</small>
        </button>
        <div id="event-banner" class="event-banner" aria-live="polite"></div>
        <div id="hazard-overlay" class="hazard-overlay" aria-hidden="true"></div>
        <div id="damage-flash" class="damage-flash" aria-hidden="true"></div>
        <div id="status" class="status">DRAW!</div>
        <div id="shop" class="shop hidden">
          <div class="shop-window">
            <h2 id="shop-title">SHOP</h2>
            <p id="shop-gold">Gold 0</p>
            <p id="shop-build" class="shop-build">NO SYNERGY - COMBINE MODS</p>
            <div id="stage-report" class="stage-report" aria-live="polite"></div>
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
          <div class="chapter-select" aria-label="Chapter select">
            <button class="chapter-card" data-chapter="1" type="button">
              <span>CHAPTER 1</span>
              <strong>Frontier Bloodline</strong>
              <small>Dust towns, rail yards, mines</small>
            </button>
            <button class="chapter-card" data-chapter="2" type="button">
              <span>CHAPTER 2</span>
              <strong>Witchfire Bayou</strong>
              <small>Cursed swamp and river ghosts</small>
            </button>
          </div>
          <button id="start-game" class="start-game" type="button">START</button>
        </div>
        <div class="touch-controls" aria-label="Touch controls">
          <div class="touch-pad" aria-label="Move">
            <button class="touch-btn touch-up" data-move="up" type="button" aria-label="Move up">&#9650;</button>
            <button class="touch-btn touch-left" data-move="left" type="button" aria-label="Move left">&#9664;</button>
            <button class="touch-btn touch-right" data-move="right" type="button" aria-label="Move right">&#9654;</button>
            <button class="touch-btn touch-down" data-move="down" type="button" aria-label="Move down">&#9660;</button>
          </div>
          <div class="touch-actions" aria-label="Actions">
            <button id="touch-tag" class="touch-action tag" type="button">TAG</button>
            <button id="touch-dynamite" class="touch-action dynamite" type="button">TNT</button>
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
          <span>Q</span><b>tag</b>
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
  maxHp: number;
  speed: number;
  lane: number;
  nextShot: number;
  nextMove: number;
  minX: number;
  maxX: number;
  direction: number;
  coverY: number;
  isBoss: boolean;
  isElite: boolean;
  pattern: EnemyPattern;
  nextSpecial: number;
  goldValue: number;
  bossPhase: 1 | 2;
  weakUntil: number;
  weakpoint?: Phaser.GameObjects.Arc;
  bounty: boolean;
  alive: boolean;
};

type EnemyPattern = "shooter" | "charger" | "tank" | "skirmisher" | "trickster";
type Brother = "blue" | "red";
type EventKind = "wanted" | "ambush" | "goldRush" | "darkness" | "deadeye";
type DamageSource = "shot" | "dynamite" | "assist" | "hazard" | "explosion";

type StageReport = {
  grade: "S" | "A" | "B" | "C";
  accuracy: number;
  maxCombo: number;
  damageTaken: number;
  clearTime: number;
  eliteKills: number;
  bonus: number;
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
  swampZombie: { texture: "swampZombie", x: 0, y: 0, w: 395, h: 530 },
  gatorOutlaw: { texture: "gatorOutlaw", x: 0, y: 0, w: 402, h: 512 },
  poisonFrog: { texture: "poisonFrog", x: 0, y: 0, w: 401, h: 390 },
  wispGunslinger: { texture: "wispGunslinger", x: 0, y: 0, w: 448, h: 527 },
  voodooMask: { texture: "voodooMask", x: 0, y: 0, w: 437, h: 582 },
  skeletalFerryman: { texture: "skeletalFerryman", x: 0, y: 0, w: 446, h: 547 },
  leechMutant: { texture: "leechMutant", x: 0, y: 0, w: 415, h: 518 },
  mossWitch: { texture: "mossWitch", x: 0, y: 0, w: 467, h: 565 },
  mosquitoGunslinger: { texture: "mosquitoGunslinger", x: 0, y: 0, w: 704, h: 601 },
  boneAlligator: { texture: "boneAlligator", x: 0, y: 0, w: 963, h: 537 }
};

const BOSS_SPRITES = {
  marshalBragg: { texture: "bossTypes1", x: 21, y: 101, w: 570, h: 642 },
  cactusJack: { texture: "bossTypes1", x: 591, y: 104, w: 591, h: 633 },
  ironBelle: { texture: "bossTypes1", x: 1182, y: 121, w: 588, h: 629 },
  coalBaron: { texture: "bossTypes2", x: 90, y: 118, w: 678, h: 757 },
  lastBrother: { texture: "bossTypes2", x: 768, y: 77, w: 696, h: 814 },
  gatorKing: { texture: "gatorKing", x: 0, y: 0, w: 695, h: 737 },
  candleWitch: { texture: "candleWitch", x: 0, y: 0, w: 582, h: 759 },
  steamboatRevenant: { texture: "steamboatRevenant", x: 0, y: 0, w: 551, h: 684 },
  boneMarketBaron: { texture: "boneMarketBaron", x: 0, y: 0, w: 808, h: 776 },
  heartrootLeviathan: { texture: "heartrootLeviathan", x: 0, y: 0, w: 891, h: 863 }
};

const SPAWN_POINTS: SpawnPoint[] = [
  { x: 36, y: 324, minX: 16, maxX: 196, kind: "edge" },
  { x: 132, y: 266, minX: 48, maxX: 276, kind: "window" },
  { x: 248, y: 312, minX: 96, maxX: 398, kind: "door" },
  { x: 382, y: 348, minX: 188, maxX: 560, kind: "street" },
  { x: 522, y: 258, minX: 342, maxX: 696, kind: "balcony" },
  { x: 642, y: 318, minX: 464, maxX: 816, kind: "window" },
  { x: 766, y: 286, minX: 602, maxX: 918, kind: "door" },
  { x: 910, y: 336, minX: 736, maxX: 944, kind: "edge" }
];

const KILLS_TO_BOSS = 100;
const WAVE_ACTS = [
  { numeral: "I", name: "SCOUT", cap: 7, spawnDelay: 760, callout: "THE HUNT BEGINS" },
  { numeral: "II", name: "CROSSFIRE", cap: 9, spawnDelay: 590, callout: "CROSSFIRE" },
  { numeral: "III", name: "ELITE HUNT", cap: 11, spawnDelay: 460, callout: "ELITES ON THE TRAIL" },
  { numeral: "IV", name: "LAST STAND", cap: 12, spawnDelay: 350, callout: "LAST STAND" }
] as const;

const STAGE_EVENTS: EventKind[] = ["wanted", "ambush", "goldRush", "darkness", "deadeye"];

const STAGE_BACKGROUND_ASSETS = [
  ["stageBackground1", "/assets/mvp-background.png"],
  ["stageBackground2", "/assets/stage-2-red-mesa.png"],
  ["stageBackground3", "/assets/stage-3-coyote-rail.png"],
  ["stageBackground4", "/assets/stage-4-black-spur-mine.png"],
  ["stageBackground5", "/assets/stage-5-boss-town.png"],
  ["stageBackground6", "/assets/stage-6-cursed-swamp-outpost.png"],
  ["stageBackground7", "/assets/stage-7-witchfire-bayou.png"],
  ["stageBackground8", "/assets/stage-8-steamboat-graveyard.png"],
  ["stageBackground9", "/assets/stage-9-voodoo-bone-market.png"],
  ["stageBackground10", "/assets/stage-10-heartroot-swamp.png"]
] as const;

const CHAPTER_ONE_SPRITE_ASSETS = [
  ["enemyTypes1", "/assets/enemy-types-1.png"],
  ["enemyTypes2", "/assets/enemy-types-2.png"],
  ["enemyTypes3", "/assets/enemy-types-3.png"],
  ["bossTypes1", "/assets/boss-types-1.png"],
  ["bossTypes2", "/assets/boss-types-2.png"]
] as const;

const CHAPTER_TWO_SPRITE_ASSETS = [
  ["swampZombie", "/assets/monsters/swamp-zombie.png"],
  ["gatorOutlaw", "/assets/monsters/gator-outlaw.png"],
  ["poisonFrog", "/assets/monsters/poison-frog.png"],
  ["wispGunslinger", "/assets/monsters/wisp-gunslinger.png"],
  ["voodooMask", "/assets/monsters/voodoo-mask.png"],
  ["skeletalFerryman", "/assets/monsters/skeletal-ferryman.png"],
  ["leechMutant", "/assets/monsters/leech-mutant.png"],
  ["mossWitch", "/assets/monsters/moss-witch.png"],
  ["mosquitoGunslinger", "/assets/monsters/mosquito-gunslinger.png"],
  ["boneAlligator", "/assets/monsters/bone-alligator.png"],
  ["gatorKing", "/assets/bosses/gator-king.png"],
  ["candleWitch", "/assets/bosses/candle-witch.png"],
  ["steamboatRevenant", "/assets/bosses/steamboat-revenant.png"],
  ["boneMarketBaron", "/assets/bosses/bone-market-baron.png"],
  ["heartrootLeviathan", "/assets/bosses/heartroot-leviathan.png"]
] as const;

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
  private playerSprite!: Phaser.GameObjects.Image;
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
  private killTarget = KILLS_TO_BOSS;
  private bossSpawned = false;
  private gameStarted = false;
  private inShop = false;
  private loadingChapter = false;
  private loadedChapters = new Set<number>();
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
  private nextEliteKill = 25;
  private waveAct = 1;
  private invulnerableUntil = 0;
  private continuesLeft = 3;
  private activeBrother: Brother = "blue";
  private tagMeter = 0;
  private nextTag = 0;
  private activeEvent?: { kind: EventKind; endsAt: number };
  private nextHazard = 0;
  private hazardZone?: { x: number; y: number; endsAt: number; nextDamage: number; sprite: Phaser.GameObjects.Arc };
  private stageStartedAt = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private stageDamageTaken = 0;
  private stageMaxCombo = 0;
  private stageEliteKills = 0;
  private stageReport?: StageReport;
  private runCompletePending = false;
  private scoreText!: HTMLElement;
  private waveText!: HTMLElement;
  private stageNameText!: HTMLElement;
  private livesText!: HTMLElement;
  private goldText!: HTMLElement;
  private comboText!: HTMLElement;
  private bossDistanceText!: HTMLElement;
  private wavePhaseText!: HTMLElement;
  private killProgress!: HTMLElement;
  private dynamiteText!: HTMLElement;
  private killStreakText!: HTMLElement;
  private brotherTagButton!: HTMLButtonElement;
  private brotherNameText!: HTMLElement;
  private tagProgress!: HTMLElement;
  private weaponNameText!: HTMLElement;
  private eventBanner!: HTMLElement;
  private hazardOverlay!: HTMLElement;
  private damageFlash!: HTMLElement;
  private statusText!: HTMLElement;
  private statusTimer?: Phaser.Time.TimerEvent;
  private shopOverlay!: HTMLElement;
  private shopTitle!: HTMLElement;
  private shopGoldText!: HTMLElement;
  private shopBuildText!: HTMLElement;
  private stageReportText!: HTMLElement;
  private introOverlay!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private chapterButtons: HTMLButtonElement[] = [];
  private touchDynamiteButton!: HTMLButtonElement;
  private touchTagButton!: HTMLButtonElement;
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
  private reticleRing!: Phaser.GameObjects.Arc;
  private reticleDot!: Phaser.GameObjects.Arc;
  private reticleHorizontal!: Phaser.GameObjects.Rectangle;
  private reticleVertical!: Phaser.GameObjects.Rectangle;
  private reticleLocked = false;
  private reticleWeak = false;

  constructor() {
    super("mumu-brothers");
  }

  preload() {
    this.load.image("mvpSprites", "/assets/mvp-sprites.png");
    const initialStage = this.startStageFromParams();
    const [backgroundKey, backgroundPath] = STAGE_BACKGROUND_ASSETS[initialStage - 1];
    this.load.image(backgroundKey, backgroundPath);
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
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,Z,X,C,F,Q,SPACE,ENTER,R") as Record<string, Phaser.Input.Keyboard.Key>;
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.swapBrother();

    const act = WAVE_ACTS[this.waveAct - 1];
    const activeCap = act.cap;
    if (!this.bossSpawned && time > this.nextSpawn && this.enemies.filter((enemy) => enemy.alive).length < activeCap) {
      this.spawnEnemy();
      this.nextSpawn = time + Math.max(280, act.spawnDelay - this.wave * 12);
    }

    this.updateEnemies(time, delta);
    this.updateBullets(delta);
    this.updateStageSystems(time);
    this.updateReticleLock();

    if (!this.bossSpawned && this.stageKills >= this.killTarget) this.spawnBoss();
  }

  private createHud() {
    this.scoreText = document.querySelector("#score")!;
    this.waveText = document.querySelector("#wave")!;
    this.stageNameText = document.querySelector("#stage-name")!;
    this.livesText = document.querySelector("#lives")!;
    this.goldText = document.querySelector("#gold")!;
    this.comboText = document.querySelector("#combo")!;
    this.bossDistanceText = document.querySelector("#boss-distance")!;
    this.wavePhaseText = document.querySelector("#wave-phase")!;
    this.killProgress = document.querySelector("#kill-progress")!;
    this.dynamiteText = document.querySelector("#dynamite-count")!;
    this.killStreakText = document.querySelector("#kill-streak")!;
    this.brotherTagButton = document.querySelector("#brother-tag")!;
    this.brotherNameText = document.querySelector("#brother-name")!;
    this.tagProgress = document.querySelector("#tag-progress")!;
    this.weaponNameText = document.querySelector("#weapon-name")!;
    this.eventBanner = document.querySelector("#event-banner")!;
    this.hazardOverlay = document.querySelector("#hazard-overlay")!;
    this.damageFlash = document.querySelector("#damage-flash")!;
    this.statusText = document.querySelector("#status")!;
    this.shopOverlay = document.querySelector("#shop")!;
    this.shopTitle = document.querySelector("#shop-title")!;
    this.shopGoldText = document.querySelector("#shop-gold")!;
    this.shopBuildText = document.querySelector("#shop-build")!;
    this.stageReportText = document.querySelector("#stage-report")!;
    this.introOverlay = document.querySelector("#intro")!;
    this.startButton = document.querySelector("#start-game")!;
    this.chapterButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-chapter]")];
    this.touchDynamiteButton = document.querySelector("#touch-dynamite")!;
    this.touchTagButton = document.querySelector("#touch-tag")!;
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
    this.brotherTagButton.addEventListener("click", () => this.swapBrother());
    this.startButton.addEventListener("click", () => this.startGame());
    this.chapterButtons.forEach((button) => {
      button.addEventListener("click", () => this.selectChapter(Number(button.dataset.chapter)));
    });
    this.refreshChapterSelect();
    this.statusText.addEventListener("click", () => {
      if (this.waitingForContinue) this.continueGame();
    });
    this.damageFlash.addEventListener("animationend", () => this.damageFlash.classList.remove("show"));
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
    this.touchTagButton.addEventListener("pointerdown", (event) => {
      stopTouch(event);
      this.swapBrother();
    });
  }

  private updateTouchMove() {
    this.touchMove.x = Number(this.activeTouchMoves.has("right")) - Number(this.activeTouchMoves.has("left"));
    this.touchMove.y = Number(this.activeTouchMoves.has("down")) - Number(this.activeTouchMoves.has("up"));
  }

  private swapBrother() {
    if (!this.gameStarted || this.inShop || this.isGameOver || this.time.now < this.nextTag) return;
    this.nextTag = this.time.now + 850;
    if (this.tagMeter >= 100) this.callBrotherAssist();
    this.activeBrother = this.activeBrother === "blue" ? "red" : "blue";
    this.playerSprite.setFrame(this.activeBrother === "blue" ? "heroBlue" : "heroRed");
    this.playerSprite.setDisplaySize(104, 112);
    this.cameras.main.flash(90, this.activeBrother === "blue" ? 70 : 190, 80, this.activeBrother === "blue" ? 210 : 60);
    this.updateHud(this.activeBrother === "blue" ? "BLUE - DEADEYE" : "RED - BOOMSTICK");
  }

  private callBrotherAssist() {
    const frame = this.activeBrother === "blue" ? "heroRed" : "heroBlue";
    const support = this.sheetSprite(-90, 360, frame, 104, 112).setDepth(14);
    this.tweens.add({
      targets: support,
      x: 1050,
      duration: 820,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        if (Phaser.Math.Between(0, 3) === 0) this.flash(support.x + 30, support.y - 20, 0xfff0a8);
      },
      onComplete: () => support.destroy()
    });
    for (const bullet of [...this.bullets]) this.destroyBullet(bullet);
    for (const enemy of [...this.enemies]) {
      if (enemy.alive) this.damageEnemy(enemy, enemy.isBoss ? 5 : 3, false, "assist");
    }
    this.tagMeter = 0;
    this.cameras.main.shake(240, 0.009);
    this.showStatus("BROTHER CROSSOVER!", "act", 1200);
  }

  private startGame() {
    if (this.gameStarted || this.loadingChapter) return;
    const chapter = this.chapterForStage(this.wave);
    this.ensureChapterLoaded(chapter, () => this.beginGame());
  }

  private beginGame() {
    this.gameStarted = true;
    this.introOverlay.classList.add("hidden");
    this.spawnWave();
    this.updateHud(this.stageTitle());
    const params = new URLSearchParams(window.location.search);
    if (params.get("boss") === "1") {
      this.stageKills = this.killTarget;
      this.spawnBoss();
    }
    const requestedEvent = params.get("event") as EventKind | null;
    if (requestedEvent && STAGE_EVENTS.includes(requestedEvent)) this.startStageEvent(requestedEvent);
    if (params.get("shop") === "1") {
      this.gold = Math.max(this.gold, 30);
      this.openShop();
    }
  }

  private selectChapter(chapter: number) {
    if (this.gameStarted) return;
    this.wave = chapter === 2 ? 6 : 1;
    this.refreshChapterSelect();
    this.updateHud(chapter === 2 ? "CHAPTER 2 READY" : "CHAPTER 1 READY");
  }

  private refreshChapterSelect() {
    const activeChapter = this.wave >= 6 ? 2 : 1;
    this.chapterButtons.forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.chapter) === activeChapter);
    });
  }

  private applyStartParams() {
    this.wave = this.startStageFromParams();
  }

  private startStageFromParams() {
    const stage = Number(new URLSearchParams(window.location.search).get("stage"));
    return Number.isFinite(stage) && stage >= 1 ? Phaser.Math.Clamp(Math.floor(stage), 1, STAGES.length) : 1;
  }

  private chapterForStage(stage: number) {
    return stage >= 6 ? 2 : 1;
  }

  private ensureChapterLoaded(chapter: number, onComplete: () => void) {
    if (this.loadedChapters.has(chapter)) {
      onComplete();
      return;
    }

    this.loadingChapter = true;
    this.startButton.disabled = true;
    this.continueButton.disabled = true;
    const previousStartLabel = this.startButton.textContent;
    const previousContinueLabel = this.continueButton.textContent;
    this.startButton.textContent = `LOADING CHAPTER ${chapter}`;
    this.continueButton.textContent = `LOADING CHAPTER ${chapter}`;
    this.updateHud(`LOADING CHAPTER ${chapter}`);
    this.queueChapterAssets(chapter);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loadedChapters.add(chapter);
      this.loadingChapter = false;
      this.registerSpriteFrames();
      this.startButton.disabled = false;
      this.continueButton.disabled = false;
      this.startButton.textContent = previousStartLabel;
      this.continueButton.textContent = previousContinueLabel;
      onComplete();
    });
    this.load.start();
  }

  private queueChapterAssets(chapter: number) {
    const stageAssets = chapter === 2 ? STAGE_BACKGROUND_ASSETS.slice(5) : STAGE_BACKGROUND_ASSETS.slice(0, 5);
    const spriteAssets = chapter === 2 ? CHAPTER_TWO_SPRITE_ASSETS : CHAPTER_ONE_SPRITE_ASSETS;
    for (const [key, assetPath] of [...stageAssets, ...spriteAssets]) {
      if (!this.textures.exists(key)) this.load.image(key, assetPath);
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

    [
      [104, 418],
      [154, 420],
      [804, 412],
      [852, 420],
      [350, 406],
      [610, 408]
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
    this.playerSprite = this.sheetSprite(0, -20, "heroBlue", 104, 112);
    this.player.add([shadow, this.playerSprite]);
    this.playerBody = this.add.rectangle(480, 442, 48, 88, 0xffffff, 0).setDepth(5);
  }

  private createReticle() {
    this.reticle = this.add.container(480, 260).setDepth(20);
    this.reticleRing = this.add.circle(0, 0, 18).setStrokeStyle(2, 0xf7e1a0, 0.9);
    this.reticleDot = this.add.circle(0, 0, 3, 0xffffff, 0.95);
    this.reticleHorizontal = this.add.rectangle(0, 0, 34, 2, 0xf7e1a0, 0.8);
    this.reticleVertical = this.add.rectangle(0, 0, 2, 34, 0xf7e1a0, 0.8);
    this.reticle.add([this.reticleRing, this.reticleHorizontal, this.reticleVertical, this.reticleDot]);
  }

  private updateReticleLock() {
    const radius = this.weaponStats().radius;
    const aimArea = new Phaser.Geom.Rectangle(this.reticle.x - radius, this.reticle.y - radius, radius * 2, radius * 2);
    const locked = this.enemies.some(
      (enemy) => enemy.alive && Phaser.Geom.Intersects.RectangleToRectangle(aimArea, enemy.body.getBounds())
    );
    const weak = this.enemies.some(
      (enemy) =>
        enemy.alive &&
        enemy.isBoss &&
        this.time.now < enemy.weakUntil &&
        Phaser.Math.Distance.Between(this.reticle.x, this.reticle.y, enemy.sprite.x, enemy.sprite.y - 72) <= radius + 30
    );
    if (locked === this.reticleLocked && weak === this.reticleWeak) return;
    this.reticleLocked = locked;
    this.reticleWeak = weak;
    const color = weak ? 0x6fffe6 : locked ? 0xff5b3d : 0xf7e1a0;
    this.reticleRing.setStrokeStyle(locked || weak ? 3 : 2, color, 0.95);
    this.reticleDot.setFillStyle(locked ? 0xffffff : color, 1);
    this.reticleHorizontal.setFillStyle(color, 0.9);
    this.reticleVertical.setFillStyle(color, 0.9);
    this.reticle.setScale(locked ? 0.88 : 1);
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

  private createEnemy(point: SpawnPoint, isBoss = false, isElite = false): Enemy {
    const c = this.add.container(point.x, point.y + 18).setDepth(point.kind === "street" || point.kind === "edge" ? 5 : 4);
    c.setAlpha(0);
    c.setScale(isBoss ? 1.18 : isElite ? 0.92 : 0.78);
    const shadow = this.add.ellipse(0, isBoss ? 52 : 34, isBoss ? 156 : 76, isBoss ? 32 : 18, 0x000000, 0.3);
    const enemyFrame = this.pickEnemyFrame(isBoss);
    const pattern = isBoss ? "tank" : this.enemyPattern(enemyFrame);
    const bossFrame = this.currentTheme().bossSprite;
    const bossMeta = BOSS_SPRITES[bossFrame];
    const bossHeight = 213;
    const bossWidth = Math.round((bossMeta.w / bossMeta.h) * bossHeight);
    const sprite = isBoss
      ? this.bossSprite(0, -58, bossFrame, bossWidth, bossHeight)
      : this.enemySprite(0, -24, enemyFrame, 100, 108);
    const aura = isElite ? this.add.ellipse(0, 22, 86, 28, 0xffd24c, 0.24).setBlendMode(Phaser.BlendModes.ADD) : undefined;
    const weakpoint = isBoss
      ? this.add.circle(0, -72, 22, 0x63ffe0, 0.2).setStrokeStyle(4, 0xbaffee, 1).setVisible(false).setDepth(8)
      : undefined;
    if (isElite) sprite.setTint(0xffd36e);
    c.add(aura ? [shadow, aura, sprite] : [shadow, sprite]);
    if (weakpoint) c.add(weakpoint);
    const body = this.add.rectangle(point.x, point.y, isBoss ? 90 : isElite ? 62 : 52, isBoss ? 130 : isElite ? 98 : 88, 0xffffff, 0).setDepth(4);
    const hp = isBoss ? 16 + this.wave * 7 : isElite ? 4 + Math.floor(this.wave / 2) : pattern === "tank" ? 2 : 1;
    const speed = this.enemySpeed(pattern, isBoss, isElite);
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
      hp,
      maxHp: hp,
      speed,
      lane: point.y,
      nextShot: this.time.now + Phaser.Math.Between(isBoss ? 950 : 1500, isBoss ? 1800 : 3100),
      nextMove: this.time.now + Phaser.Math.Between(700, 1600),
      minX: isBoss ? 300 : point.minX,
      maxX: isBoss ? 680 : point.maxX,
      direction: point.x < 480 ? 1 : -1,
      coverY: point.y,
      isBoss,
      isElite,
      pattern,
      nextSpecial: this.time.now + Phaser.Math.Between(1200, 2600),
      goldValue: isBoss ? 10 : isElite ? 5 : 1,
      bossPhase: 1,
      weakUntil: 0,
      weakpoint,
      bounty: false,
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
    this.nextEnemyShot = this.time.now + 2600;
    this.invulnerableUntil = this.time.now + 5000;
    this.lives = Math.max(this.lives, this.maxLives);
    this.stageKills = 0;
    this.bossSpawned = false;
    this.waveAct = 1;
    this.nextEliteKill = 25;
    this.killTarget = KILLS_TO_BOSS;
    this.nextSpawn = this.time.now + 360;
    this.nextHazard = this.time.now + 12000;
    this.activeEvent = undefined;
    this.hazardZone?.sprite.destroy();
    this.hazardZone = undefined;
    this.eventBanner.className = "event-banner";
    this.eventBanner.textContent = "";
    this.hazardOverlay.className = "hazard-overlay";
    this.stageStartedAt = this.time.now;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.stageDamageTaken = 0;
    this.stageMaxCombo = 0;
    this.stageEliteKills = 0;
    this.stageReport = undefined;
    this.runCompletePending = false;
    const count = Math.min(5 + Math.floor(this.wave / 3), WAVE_ACTS[0].cap);
    for (let i = 0; i < count; i += 1) this.spawnEnemy();
  }

  private spawnEnemy(forceElite = false, bounty = false) {
    const point = this.pickOpenSpawnPoint();
    if (!point) return;
    const isElite = forceElite || (!this.bossSpawned && this.stageKills >= this.nextEliteKill);
    if (isElite && !forceElite) this.nextEliteKill += 25;
    const enemy = this.createEnemy(point, false, isElite);
    enemy.bounty = bounty;
    this.enemies.push(enemy);
    if (isElite) this.updateHud("ELITE OUTLAW!");
  }

  private pickOpenSpawnPoint() {
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    const shuffled = Phaser.Utils.Array.Shuffle([...SPAWN_POINTS]);
    for (const base of shuffled) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const point = {
          ...base,
          x: Phaser.Math.Between(base.minX + 28, base.maxX - 28),
          y: Phaser.Math.Clamp(base.y + Phaser.Math.Between(-18, 18), 238, 366)
        };
        if (this.positionHasRoom(point.x, point.y, undefined, 126, 82)) return point;
      }
    }
    return undefined;
  }

  private positionHasRoom(x: number, y: number, ignored?: Enemy, horizontalGap = 96, verticalGap = 54) {
    return this.enemies.every((enemy) => {
      if (!enemy.alive || enemy === ignored) return true;
      return Math.abs(enemy.sprite.x - x) > horizontalGap || Math.abs(enemy.sprite.y - y) > verticalGap;
    });
  }

  private spawnBoss() {
    this.clearCombat();
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
    this.shotsFired += 1;
    const start = new Phaser.Math.Vector2(this.player.x, this.player.y - 18);
    const target = new Phaser.Math.Vector2(this.reticle.x, this.reticle.y);
    const direction = target.subtract(start).normalize();
    this.cameras.main.shake(weapon.shake, 0.0025);
    this.flash(start.x + direction.x * 34, start.y + direction.y * 34, 0xfff0a8);
    this.impactAt(this.reticle.x, this.reticle.y);
    const critical = weapon.critChance > 0 && Math.random() < weapon.critChance;
    const damage = critical ? weapon.damage * 2 : weapon.damage;
    let hit = this.hitScanAt(this.reticle.x, this.reticle.y, damage, weapon.radius, weapon.pierce);
    for (let index = 0; index < weapon.extraHits; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const lane = Math.floor(index / 2) + 1;
      hit = this.hitScanAt(
        this.reticle.x + side * weapon.radius * 0.72 * lane,
        this.reticle.y,
        damage,
        weapon.radius,
        weapon.pierce
      ) || hit;
    }
    if (hit) this.shotsHit += 1;
    if (critical && hit) this.pop(this.reticle.x, this.reticle.y, "CRITICAL!");
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, fromPlayer: boolean) {
    const sprite = this.add.circle(x, y, fromPlayer ? 5 : 6, fromPlayer ? 0xfff2a8 : 0xff6959, 1).setDepth(10);
    sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.bullets.push({ sprite, vx, vy, fromPlayer, life: 900 });
  }

  private updateEnemies(time: number, delta: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.moveEnemy(enemy, time, delta);
      this.separateEnemy(enemy);
      enemy.body.setPosition(enemy.sprite.x, enemy.sprite.y);
      enemy.sprite.setScale(enemy.sprite.x < this.player.x ? 1 : -1, 1);
      if (enemy.isBoss) this.updateBossPattern(enemy, time);

      if (
        time > enemy.nextShot &&
        time > this.nextEnemyShot &&
        this.enemyCanShoot(enemy) &&
        Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y) < 640
      ) {
        const start = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y - 18);
        const eventSpread = this.activeEvent?.kind === "darkness" ? 18 : 0;
        const spread = (enemy.isBoss ? 10 : enemy.isElite ? 18 : 34) + eventSpread;
        const target = new Phaser.Math.Vector2(
          this.player.x + Phaser.Math.Between(-spread, spread),
          this.player.y - 14 + Phaser.Math.Between(-Math.floor(spread / 2), Math.floor(spread / 2))
        );
        const direction = target.subtract(start).normalize();
        this.tweens.add({
          targets: enemy.sprite,
          y: enemy.sprite.y - 10,
          yoyo: true,
          duration: 95,
          ease: "Quad.easeOut"
        });
        const bulletSpeed = enemy.isBoss ? 260 + this.wave * 5 : enemy.isElite ? 245 + this.wave * 4 : 210 + this.wave * 4;
        this.spawnBullet(start.x, start.y, direction.x * bulletSpeed, direction.y * bulletSpeed, false);
        this.flash(start.x + direction.x * 24, start.y + direction.y * 24, enemy.isBoss ? 0xffd24c : 0xff6048);
        enemy.nextShot = time + this.enemyShotDelay(enemy);
        this.nextEnemyShot = time + (enemy.isBoss ? 520 : enemy.isElite ? 680 : 860);
      }
    }
  }

  private updateBossPattern(enemy: Enemy, time: number) {
    if (time <= enemy.nextSpecial) return;
    enemy.nextSpecial = time + (enemy.bossPhase === 2 ? 3000 : 4200);
    const warning = this.add.circle(enemy.sprite.x, enemy.sprite.y - 42, 32).setStrokeStyle(5, 0xff4438, 0.95).setDepth(13);
    this.tweens.add({ targets: warning, scale: 2.1, alpha: 0.15, duration: 520, ease: "Quad.easeIn" });
    this.time.delayedCall(520, () => {
      warning.destroy();
      if (!enemy.alive) return;
      enemy.weakUntil = this.time.now + (enemy.bossPhase === 2 ? 1350 : 1750);
      enemy.weakpoint?.setVisible(true);
      this.pop(enemy.sprite.x, enemy.sprite.y - 90, "WEAKPOINT!");
      const shots = enemy.bossPhase === 2 ? 5 : 3;
      for (let index = 0; index < shots; index += 1) {
        const start = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y - 28);
        const offset = (index - (shots - 1) / 2) * 62;
        const target = new Phaser.Math.Vector2(this.player.x + offset, this.player.y - 12);
        const direction = target.subtract(start).normalize();
        const speed = 235 + this.wave * 5 + enemy.bossPhase * 20;
        this.spawnBullet(start.x, start.y, direction.x * speed, direction.y * speed, false);
      }
      this.time.delayedCall(enemy.bossPhase === 2 ? 1350 : 1750, () => {
        if (enemy.alive && this.time.now >= enemy.weakUntil) enemy.weakpoint?.setVisible(false);
      });
    });
  }

  private moveEnemy(enemy: Enemy, time: number, delta: number) {
    if (enemy.pattern === "trickster" && !enemy.isBoss && time > enemy.nextSpecial) {
      enemy.sprite.alpha = 0.35;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const nextX = Phaser.Math.Between(enemy.minX, enemy.maxX);
        const nextY = Phaser.Math.Clamp(enemy.coverY + Phaser.Math.Between(-42, 42), 238, 370);
        if (!this.positionHasRoom(nextX, nextY, enemy, 120, 76)) continue;
        enemy.sprite.x = nextX;
        enemy.coverY = nextY;
        break;
      }
      this.tweens.add({ targets: enemy.sprite, alpha: 1, duration: 160, ease: "Quad.easeOut" });
      enemy.nextSpecial = time + Phaser.Math.Between(enemy.isElite ? 1400 : 2300, enemy.isElite ? 2400 : 3800);
    }

    if (time > enemy.nextMove) {
      if (enemy.pattern === "charger") {
        enemy.direction = enemy.sprite.x < this.player.x ? 1 : -1;
      } else {
        enemy.direction = Math.random() > 0.5 ? 1 : -1;
      }
      enemy.nextMove = time + Phaser.Math.Between(enemy.pattern === "skirmisher" ? 420 : 650, enemy.pattern === "tank" ? 1900 : 1450);
    }

    const pursuit = enemy.pattern === "charger" ? (enemy.sprite.x < this.player.x ? 1 : -1) : enemy.direction;
    enemy.sprite.x += pursuit * enemy.speed * (delta / 1000);
    if (enemy.sprite.x <= enemy.minX || enemy.sprite.x >= enemy.maxX) enemy.direction *= -1;
    enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x, enemy.minX, enemy.maxX);

    const bob = enemy.pattern === "skirmisher" ? 8 : enemy.pattern === "trickster" ? 12 : 3;
    const drift = enemy.pattern === "charger" ? Math.sin(time / 260) * 10 : Math.sin((time + enemy.lane * 7) / 360) * bob;
    enemy.sprite.y = Phaser.Math.Clamp(enemy.coverY + drift, 230, 382);
  }

  private separateEnemy(enemy: Enemy) {
    if (enemy.isBoss) return;
    for (const other of this.enemies) {
      if (!other.alive || other === enemy || other.isBoss) continue;
      const dx = enemy.sprite.x - other.sprite.x;
      const dy = enemy.sprite.y - other.sprite.y;
      if (Math.abs(dx) >= 104 || Math.abs(dy) >= 68) continue;
      const push = (104 - Math.abs(dx)) * 0.08;
      enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x + (dx >= 0 ? push : -push), enemy.minX, enemy.maxX);
    }
  }

  private enemyCanShoot(enemy: Enemy) {
    return enemy.isBoss || enemy.pattern === "shooter" || enemy.pattern === "skirmisher" || enemy.pattern === "trickster";
  }

  private enemyShotDelay(enemy: Enemy) {
    if (enemy.isBoss) return Phaser.Math.Between(1250, 2100);
    if (enemy.isElite) return Phaser.Math.Between(1900, 3000);
    if (enemy.pattern === "shooter") return Phaser.Math.Between(2300, 3600);
    if (enemy.pattern === "skirmisher") return Phaser.Math.Between(2700, 4100);
    return Phaser.Math.Between(3000, 4500);
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
      return false;
    }

    const hitArea = new Phaser.Geom.Rectangle(x - radius, y - radius, radius * 2, radius * 2);

    const targets = this.enemies
      .filter((enemy) => {
        if (!enemy.alive) return false;
        const bodyHit = Phaser.Geom.Intersects.RectangleToRectangle(hitArea, enemy.body.getBounds());
        const weakHit =
          enemy.isBoss &&
          this.time.now < enemy.weakUntil &&
          Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y - 72) <= radius + 28;
        return bodyHit || weakHit;
      })
      .sort((a, b) => Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(x, y, b.sprite.x, b.sprite.y));
    if (targets.length > 0) {
      for (const enemy of targets.slice(0, pierce + 1)) {
        const weakHit =
          enemy.isBoss &&
          this.time.now < enemy.weakUntil &&
          Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y - 72) <= radius + 28;
        this.damageEnemy(enemy, damage, weakHit, "shot");
      }
      return true;
    }

    for (const prop of [...this.props]) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(hitArea, prop.body.getBounds())) continue;
      this.damageProp(prop);
      return false;
    }
    return false;
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

  private damageEnemy(enemy: Enemy, damage: number, weakHit = false, source: DamageSource = "shot") {
    if (!enemy.alive) return;
    const resolvedDamage = weakHit ? Math.ceil(damage * (this.activeBrother === "blue" ? 2.5 : 2)) : damage;
    enemy.hp -= resolvedDamage;
    this.flash(enemy.sprite.x, enemy.sprite.y - 20, 0xfff0a8);
    this.tintContainer(enemy.sprite, 0xffe0a0);
    this.time.delayedCall(70, () => this.clearContainerTint(enemy.sprite));
    if (enemy.hp > 0) {
      if (enemy.isBoss && enemy.bossPhase === 1 && enemy.hp <= enemy.maxHp / 2) this.enterBossPhaseTwo(enemy);
      if (enemy.isBoss) this.pop(enemy.sprite.x, enemy.sprite.y - 82, weakHit ? `WEAK -${resolvedDamage}` : `${enemy.hp}`);
      this.updateHud();
      return;
    }

    enemy.alive = false;
    this.combo += 1;
    this.stageMaxCombo = Math.max(this.stageMaxCombo, this.combo);
    this.score += enemy.isBoss ? 1000 + this.wave * 250 : 80 * this.combo;
    const goldRush = this.activeEvent?.kind === "goldRush" && this.time.now < this.activeEvent.endsAt;
    const bountyBonus = enemy.bounty && this.activeEvent?.kind === "wanted" ? 10 : 0;
    const fuseBonus = source === "dynamite" && this.gunDamageLevel >= 3 ? 1 : 0;
    const earnedGold = enemy.goldValue * (goldRush ? 2 : 1) + bountyBonus + fuseBonus;
    this.gold += earnedGold;
    if (!enemy.isBoss) {
      this.stageKills += 1;
      if (enemy.isElite) this.stageEliteKills += 1;
      this.tagMeter = Phaser.Math.Clamp(this.tagMeter + (enemy.isElite ? 22 : 9), 0, 100);
      this.updateWaveAct();
    }
    this.pop(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? `+${earnedGold}G BOSS` : enemy.isElite ? `+${earnedGold}G ELITE` : `+${earnedGold}G`);
    this.explode(enemy.sprite.x, enemy.sprite.y);
    enemy.body.destroy();
    this.cameras.main.shake(enemy.isBoss ? 280 : 70, enemy.isBoss ? 0.008 : 0.0015);
    this.tweens.add({
      targets: enemy.sprite,
      alpha: 0,
      scale: enemy.isBoss ? 1.12 : 1.18,
      y: enemy.sprite.y - 10,
      duration: enemy.isBoss ? 240 : 110,
      ease: "Quad.easeOut",
      onComplete: () => enemy.sprite.destroy()
    });

    if (source === "shot" && this.weaponStats().explosive && !enemy.isBoss) {
      const nearby = this.enemies.filter(
        (other) => other.alive && other !== enemy && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, other.sprite.x, other.sprite.y) < 118
      );
      for (const other of nearby.slice(0, 3)) this.damageEnemy(other, 1, false, "explosion");
    }
    this.updateHud();

    if (enemy.isBoss) this.finishStage();
  }

  private enterBossPhaseTwo(enemy: Enemy) {
    enemy.bossPhase = 2;
    enemy.speed *= 1.35;
    enemy.nextShot = this.time.now + 400;
    enemy.nextSpecial = this.time.now + 900;
    enemy.weakUntil = this.time.now + 1500;
    enemy.weakpoint?.setVisible(true);
    const flash = this.add.rectangle(480, 270, 960, 540, this.currentTheme().accent, 0.22).setDepth(18);
    this.tweens.add({ targets: flash, alpha: 0, duration: 560, onComplete: () => flash.destroy() });
    this.cameras.main.shake(440, 0.014);
    this.showStatus("PHASE II - RAGE", "boss", 1500);
  }

  private finishStage() {
    this.stageReport = this.buildStageReport();
    this.gold += this.stageReport.bonus;
    this.clearCombat();
    this.runCompletePending = this.wave >= STAGES.length;
    this.openShop();
  }

  private openShop() {
    this.inShop = true;
    this.shopOverlay.classList.remove("hidden");
    this.shopTitle.textContent = this.runCompletePending ? "RUN COMPLETE" : `GUNSMITH - STAGE ${this.wave} CLEAR`;
    this.continueButton.textContent = this.runCompletePending ? "Finish Run" : "Next Stage";
    this.renderStageReport();
    this.updateShop();
  }

  private leaveShop() {
    if (!this.inShop || this.loadingChapter) return;
    if (this.runCompletePending) {
      this.inShop = false;
      this.shopOverlay.classList.add("hidden");
      this.isGameOver = true;
      this.statusText.classList.add("large");
      this.updateHud("RUN CLEAR - R TO RESTART");
      return;
    }
    const nextStage = this.wave + 1;
    this.ensureChapterLoaded(this.chapterForStage(nextStage), () => {
      this.inShop = false;
      this.shopOverlay.classList.add("hidden");
      this.wave = nextStage;
      this.combo = 0;
      this.spawnWave();
      this.updateHud(this.stageTitle());
    });
  }

  private buildStageReport(): StageReport {
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const clearTime = Math.max(1, Math.round((this.time.now - this.stageStartedAt) / 1000));
    let points = accuracy >= 75 ? 2 : accuracy >= 55 ? 1 : 0;
    points += this.stageMaxCombo >= 30 ? 2 : this.stageMaxCombo >= 12 ? 1 : 0;
    points += this.stageDamageTaken === 0 ? 2 : this.stageDamageTaken <= 2 ? 1 : 0;
    points += clearTime <= 150 ? 2 : clearTime <= 210 ? 1 : 0;
    points += this.stageEliteKills >= 3 ? 2 : this.stageEliteKills >= 1 ? 1 : 0;
    const grade: StageReport["grade"] = points >= 9 ? "S" : points >= 7 ? "A" : points >= 5 ? "B" : "C";
    const bonus = { S: 15, A: 10, B: 6, C: 2 }[grade];
    return { grade, accuracy, maxCombo: this.stageMaxCombo, damageTaken: this.stageDamageTaken, clearTime, eliteKills: this.stageEliteKills, bonus };
  }

  private renderStageReport() {
    if (!this.stageReport) {
      this.stageReportText.classList.add("empty");
      this.stageReportText.textContent = "BUILD YOUR NEXT WEAPON";
      return;
    }
    const report = this.stageReport;
    this.stageReportText.classList.remove("empty");
    this.stageReportText.innerHTML = `
      <strong class="grade grade-${report.grade.toLowerCase()}">${report.grade}</strong>
      <span><b>${report.accuracy}%</b><small>ACCURACY</small></span>
      <span><b>x${report.maxCombo}</b><small>MAX COMBO</small></span>
      <span><b>${report.damageTaken}</b><small>DAMAGE</small></span>
      <span><b>${report.clearTime}s</b><small>TIME</small></span>
      <span><b>${report.eliteKills}</b><small>ELITES</small></span>
      <em>+${report.bonus}G</em>`;
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
    this.shopGoldText.textContent = `Gold ${this.gold} | ${this.weaponName()} | DMG ${this.gunDamageLevel} RNG ${this.gunRangeLevel} REL ${this.gunReloadLevel} PRC ${this.gunPierceLevel}`;
    this.shopBuildText.textContent = this.synergySummary();
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
    const blue = this.activeBrother === "blue";
    const deadeye = this.activeEvent?.kind === "deadeye";
    const wideBore = this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1;
    return {
      damage: 1 + this.gunDamageLevel + (blue ? 0 : 1),
      radius: 28 + this.gunRangeLevel * 10 + (blue ? 0 : 14),
      delay: Math.round(Math.max(72, 210 - this.gunReloadLevel * 27) * (blue ? 0.76 : 1.24) * (deadeye ? 0.72 : 1)),
      extraHits: (blue ? 0 : 2) + (wideBore ? 2 : 0),
      pierce: this.gunPierceLevel + (deadeye ? 2 : 0),
      shake: Math.max(18, 45 - this.gunReloadLevel * 3),
      critChance: this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2 ? 0.2 : blue ? 0.06 : 0,
      explosive: this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1
    };
  }

  private weaponName() {
    if (this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1) return this.activeBrother === "blue" ? "DYNAMO REPEATER" : "THUNDER BORE";
    if (this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2) return "GUNSLINGER CLOCK";
    if (this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1) return "WIDE BORE";
    const total = this.gunDamageLevel + this.gunRangeLevel + this.gunReloadLevel + this.gunPierceLevel;
    if (total >= 6) return this.activeBrother === "blue" ? "BRASS VIPER" : "BOOMSTICK MK II";
    return this.activeBrother === "blue" ? "PEACEMAKER" : "SCATTERGUN";
  }

  private synergySummary() {
    const synergies: string[] = [];
    if (this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1) synergies.push("DYNAMO ROUNDS");
    if (this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2) synergies.push("GUNSLINGER CLOCK");
    if (this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1) synergies.push("WIDE BORE");
    if (this.gunDamageLevel >= 3 && this.dynamite > 0) synergies.push("GOLDEN FUSE");
    return synergies.length > 0 ? `SYNERGIES: ${synergies.join(" + ")}` : "NO SYNERGY - COMBINE MODS";
  }

  private throwDynamite() {
    if (this.isGameOver || this.inShop || this.dynamite <= 0) {
      if (!this.inShop && this.dynamite <= 0) this.updateHud("NO DYNAMITE");
      return;
    }
    this.dynamite -= 1;
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    for (const enemy of liveEnemies) {
      this.damageEnemy(enemy, enemy.isBoss ? Math.ceil(enemy.maxHp * 0.28) : 999, false, "dynamite");
    }
    this.cameras.main.shake(420, 0.018);
    this.updateHud("DYNAMITE!");
  }

  private damagePlayer() {
    this.lives -= 1;
    this.stageDamageTaken += 1;
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 2100;
    this.damageFlash.classList.remove("show");
    void this.damageFlash.offsetWidth;
    this.damageFlash.classList.add("show");
    this.player.setAlpha(0.62);
    this.cameras.main.shake(220, 0.01);
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 100,
      yoyo: true,
      repeat: 7,
      onComplete: () => this.player.setAlpha(1)
    });
    if (this.lives <= 0) {
      if (this.tagMeter >= 50) {
        this.brotherRescue();
      } else {
        this.offerContinue();
      }
    } else {
      this.updateHud();
    }
  }

  private brotherRescue() {
    this.tagMeter = 0;
    this.activeBrother = this.activeBrother === "blue" ? "red" : "blue";
    this.playerSprite.setFrame(this.activeBrother === "blue" ? "heroBlue" : "heroRed").setDisplaySize(104, 112);
    this.lives = Math.max(2, Math.ceil(this.maxLives / 2));
    this.invulnerableUntil = this.time.now + 3500;
    for (const bullet of [...this.bullets]) this.destroyBullet(bullet);
    this.player.setAlpha(1);
    this.cameras.main.flash(240, 245, 192, 82);
    this.showStatus("BROTHER RESCUE!", "boss", 1500);
    this.updateHud();
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
        fontFamily: "Courier New, monospace",
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
    const act = WAVE_ACTS[this.waveAct - 1];
    const boss = this.enemies.find((enemy) => enemy.alive && enemy.isBoss);
    const progress = boss
      ? Phaser.Math.Clamp((boss.hp / boss.maxHp) * 100, 0, 100)
      : this.bossSpawned
        ? 0
        : Phaser.Math.Clamp((this.stageKills / this.killTarget) * 100, 0, 100);
    const remaining = Math.max(0, this.killTarget - this.stageKills);
    this.scoreText.textContent = this.score.toLocaleString("en-US");
    this.waveText.textContent = String(this.wave);
    this.stageNameText.textContent = this.currentTheme().name;
    this.livesText.innerHTML = Array.from(
      { length: this.maxLives },
      (_, index) => `<i class="${index < this.lives ? "full" : ""}"></i>`
    ).join("");
    this.goldText.textContent = String(this.gold);
    this.dynamiteText.textContent = `x${this.dynamite}`;
    this.comboText.textContent = this.bossSpawned ? this.currentTheme().bossName ?? "BOSS" : `${this.stageKills} / ${this.killTarget}`;
    this.bossDistanceText.textContent = boss
      ? `PHASE ${boss.bossPhase} - ${this.time.now < boss.weakUntil ? "WEAKPOINT OPEN" : "READ THE TELL"}`
      : this.bossSpawned
        ? "BOSS DOWN"
        : `BOSS IN ${remaining}`;
    this.wavePhaseText.textContent = boss ? `HP ${Math.max(0, boss.hp)} / ${boss.maxHp}` : this.bossSpawned ? "FINAL DUEL" : `${act.numeral} / ${act.name}`;
    this.killProgress.style.width = `${progress}%`;
    this.killProgress.classList.toggle("boss", this.bossSpawned);
    this.killStreakText.innerHTML = `DEADEYE <strong>x${this.combo}</strong>`;
    this.killStreakText.classList.toggle("show", this.combo >= 3 && !this.inShop && !this.isGameOver);
    this.brotherNameText.textContent = this.activeBrother === "blue" ? "BLUE / DEADEYE" : "RED / BOOMSTICK";
    this.tagProgress.style.width = `${this.tagMeter}%`;
    this.weaponNameText.textContent = this.weaponName();
    this.brotherTagButton.classList.toggle("red", this.activeBrother === "red");
    this.brotherTagButton.classList.toggle("ready", this.tagMeter >= 100);
    this.touchTagButton.classList.toggle("ready", this.tagMeter >= 100);
    if (this.inShop) this.updateShop();
    if (status) this.showStatus(status);
  }

  private showStatus(text: string, kind?: "stage" | "act" | "boss" | "minor", duration?: number) {
    this.statusTimer?.remove(false);
    const resolvedKind = kind ?? (text.startsWith("STAGE") ? "stage" : text.startsWith("BOSS") ? "boss" : "minor");
    this.statusText.textContent = text;
    this.statusText.classList.remove("stage", "act", "boss", "minor");
    this.statusText.classList.add("show", resolvedKind);
    const visibleFor = duration ?? (resolvedKind === "stage" ? 1800 : resolvedKind === "boss" ? 1600 : 980);
    this.statusTimer = this.time.delayedCall(visibleFor, () => {
      if (!this.isGameOver) this.statusText.classList.remove("show", "stage", "act", "boss", "minor");
    });
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
      if (!this.textures.exists(frame.texture)) continue;
      const enemyTexture = this.textures.get(frame.texture);
      if (!enemyTexture.has(name)) {
        enemyTexture.add(name, 0, frame.x, frame.y, frame.w, frame.h);
      }
    }
    for (const [name, frame] of Object.entries(BOSS_SPRITES)) {
      if (!this.textures.exists(frame.texture)) continue;
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
    const availablePool = theme.enemyPool.slice(0, Phaser.Math.Clamp(this.waveAct + 1, 1, theme.enemyPool.length));
    return (isBoss
      ? theme.bossEnemy
      : Phaser.Utils.Array.GetRandom(availablePool)) as keyof typeof ENEMY_SPRITES;
  }

  private updateWaveAct() {
    const nextAct = Phaser.Math.Clamp(Math.floor(this.stageKills / 25) + 1, 1, WAVE_ACTS.length);
    if (nextAct === this.waveAct || this.stageKills >= this.killTarget) return;
    this.waveAct = nextAct;
    const act = WAVE_ACTS[this.waveAct - 1];
    this.showStatus(`ACT ${act.numeral} - ${act.callout}`, "act", 1500);
    this.startStageEvent();
  }

  private startStageEvent(forcedKind?: EventKind) {
    if (this.activeEvent?.kind === "darkness") this.hazardOverlay.classList.remove("show", "darkness");
    const kind = forcedKind ?? STAGE_EVENTS[(this.wave + this.waveAct - 2) % STAGE_EVENTS.length];
    const labels: Record<EventKind, string> = {
      wanted: "WANTED - 10G BOUNTY",
      ambush: "AMBUSH - SURROUNDED",
      goldRush: "GOLD RUSH - DOUBLE GOLD",
      darkness: "BLACKOUT - ENEMY AIM SHAKEN",
      deadeye: "DEAD EYE - RAPID PIERCE"
    };
    this.activeEvent = { kind, endsAt: this.time.now + (kind === "wanted" ? 14000 : 10500) };
    this.eventBanner.textContent = labels[kind];
    this.eventBanner.className = `event-banner show ${kind}`;
    if (kind === "wanted") {
      this.time.delayedCall(350, () => {
        if (!this.inShop && !this.bossSpawned && this.activeEvent?.kind === "wanted") this.spawnEnemy(true, true);
      });
    }
    if (kind === "ambush") {
      for (let index = 0; index < 5; index += 1) {
        this.time.delayedCall(index * 180, () => {
          if (!this.inShop && !this.bossSpawned && this.activeEvent?.kind === "ambush") this.spawnEnemy(index === 4);
        });
      }
    }
    if (kind === "darkness") this.hazardOverlay.classList.add("show", "darkness");
    this.updateHud();
  }

  private updateStageSystems(time: number) {
    if (this.activeEvent && time >= this.activeEvent.endsAt) {
      const wasDark = this.activeEvent.kind === "darkness";
      this.activeEvent = undefined;
      this.eventBanner.className = "event-banner";
      this.eventBanner.textContent = "";
      if (wasDark) this.hazardOverlay.classList.remove("show", "darkness");
      this.updateHud();
    }
    if (this.hazardZone) {
      if (time >= this.hazardZone.endsAt) {
        this.hazardZone.sprite.destroy();
        this.hazardZone = undefined;
      } else if (
        time >= this.hazardZone.nextDamage &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hazardZone.x, this.hazardZone.y) < 88 &&
        time > this.invulnerableUntil
      ) {
        this.hazardZone.nextDamage = time + 1200;
        this.damagePlayer();
      }
    }
    if (time >= this.nextHazard) {
      this.nextHazard = time + (this.bossSpawned ? 10500 : 15500);
      this.triggerStageHazard();
    }
  }

  private triggerStageHazard() {
    const hazard = ["crossfire", "sandstorm", "train", "blast", "hellfire", "poison", "lightning", "fog", "hex", "roots"][(this.wave - 1) % 10];
    if (hazard === "sandstorm" || hazard === "fog") {
      this.hazardOverlay.classList.add("show", hazard);
      this.showStatus(hazard === "sandstorm" ? "MESA SANDSTORM" : "RIVER FOG", "minor", 1100);
      this.time.delayedCall(4200, () => this.hazardOverlay.classList.remove("show", hazard));
      return;
    }
    if (hazard === "poison" || hazard === "roots") {
      this.createHazardZone(hazard === "poison" ? 0x4cff72 : 0x9dff6a, hazard === "poison" ? "POISON BLOOM" : "HEARTROOT RISES");
      return;
    }
    if (hazard === "train") {
      const warning = this.add.rectangle(480, 348, 960, 76, 0xff5a36, 0.2).setDepth(7);
      this.showStatus("IRON BELLE EXPRESS", "minor", 1000);
      this.tweens.add({ targets: warning, alpha: 0.55, yoyo: true, repeat: 3, duration: 140 });
      this.time.delayedCall(950, () => {
        warning.destroy();
        if (this.inShop || this.isGameOver) return;
        const train = this.add.rectangle(-220, 348, 420, 84, 0x2c2420, 0.96).setStrokeStyle(5, 0xe7b34e).setDepth(12);
        this.tweens.add({ targets: train, x: 1180, duration: 850, onComplete: () => train.destroy() });
        for (const enemy of [...this.enemies]) if (enemy.alive && enemy.sprite.y > 320) this.damageEnemy(enemy, 3, false, "hazard");
        if (this.player.y < 425 && this.time.now > this.invulnerableUntil) this.damagePlayer();
      });
      return;
    }
    if (hazard === "blast" || hazard === "hellfire") {
      this.blastHazard(hazard === "hellfire" ? 0xff4c32 : 0xffbc4f, hazard === "hellfire" ? "HELLFIRE" : "MINE BLAST");
      return;
    }
    const color = hazard === "lightning" ? 0x7bfff2 : hazard === "hex" ? 0xc178ff : hazard === "hellfire" ? 0xff4c32 : 0xffbc4f;
    this.strikeHazard(color, hazard === "lightning" ? "BAYOU LIGHTNING" : hazard === "hex" ? "VOODOO HEX" : "CROSSFIRE");
  }

  private blastHazard(color: number, label: string) {
    const x = Phaser.Math.Between(150, 810);
    const y = Phaser.Math.Between(380, 452);
    const warning = this.add.circle(x, y, 28, color, 0.12).setStrokeStyle(5, color, 0.9).setDepth(12);
    this.showStatus(label, "minor", 900);
    this.tweens.add({ targets: warning, scale: 3.2, alpha: 0.55, duration: 760 });
    this.time.delayedCall(760, () => {
      warning.destroy();
      if (this.inShop || this.isGameOver) return;
      this.explode(x, y);
      const radius = 112;
      for (const enemy of [...this.enemies]) {
        if (enemy.alive && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, x, y) < radius) this.damageEnemy(enemy, 3, false, "hazard");
      }
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < radius && this.time.now > this.invulnerableUntil) this.damagePlayer();
      this.cameras.main.shake(240, 0.01);
    });
  }

  private strikeHazard(color: number, label: string) {
    const x = Phaser.Math.Between(130, 830);
    const warning = this.add.rectangle(x, 280, 48, 520, color, 0.14).setDepth(11);
    this.showStatus(label, "minor", 950);
    this.tweens.add({ targets: warning, alpha: 0.52, yoyo: true, repeat: 3, duration: 120 });
    this.time.delayedCall(760, () => {
      warning.destroy();
      if (this.inShop || this.isGameOver) return;
      const strike = this.add.rectangle(x, 280, 26, 520, color, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(14);
      this.tweens.add({ targets: strike, alpha: 0, scaleX: 3.2, duration: 260, onComplete: () => strike.destroy() });
      for (const enemy of [...this.enemies]) if (enemy.alive && Math.abs(enemy.sprite.x - x) < 68) this.damageEnemy(enemy, 2, false, "hazard");
      if (Math.abs(this.player.x - x) < 48 && this.time.now > this.invulnerableUntil) this.damagePlayer();
    });
  }

  private createHazardZone(color: number, label: string) {
    const x = Phaser.Math.Between(170, 790);
    const y = 442;
    const warning = this.add.circle(x, y, 28, color, 0.12).setStrokeStyle(4, color, 0.85).setDepth(4);
    this.showStatus(label, "minor", 1000);
    this.tweens.add({ targets: warning, scale: 3, alpha: 0.42, duration: 720 });
    this.time.delayedCall(720, () => {
      warning.destroy();
      if (this.inShop || this.isGameOver) return;
      const zone = this.add.circle(x, y, 88, color, 0.24).setStrokeStyle(3, color, 0.65).setDepth(3);
      this.hazardZone?.sprite.destroy();
      this.hazardZone = { x, y, endsAt: this.time.now + 5200, nextDamage: this.time.now + 650, sprite: zone };
      for (const enemy of [...this.enemies]) {
        if (enemy.alive && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, x, y) < 108) this.damageEnemy(enemy, 1, false, "hazard");
      }
    });
  }

  private enemyPattern(frameName: keyof typeof ENEMY_SPRITES): EnemyPattern {
    if (["cactusMutant", "swampZombie", "boneAlligator", "armoredSheriff"].includes(frameName)) return "tank";
    if (["scorpionBandit", "poisonFrog", "leechMutant", "demonOutlaw"].includes(frameName)) return "charger";
    if (["ghostMiner", "wispGunslinger", "mossWitch", "vampireCowboy"].includes(frameName)) return "trickster";
    if (["maskedOutlaw", "trainRobber", "gatorOutlaw", "mosquitoGunslinger"].includes(frameName)) return "skirmisher";
    return "shooter";
  }

  private enemySpeed(pattern: EnemyPattern, isBoss: boolean, isElite: boolean) {
    const base = isBoss ? 22 + this.wave * 2 : Phaser.Math.Between(44, 78) + this.wave * 2.6;
    const patternBoost = { shooter: 1, charger: 1.36, tank: 0.72, skirmisher: 1.18, trickster: 0.94 }[pattern];
    return base * patternBoost * (isElite ? 1.16 : 1);
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
      enemy.alive = false;
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
