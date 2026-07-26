import Phaser from "phaser";
import "./styles.css";
import {
  getLeaderboardNickname,
  loadLeaderboard,
  submitLeaderboardScore,
  type LeaderboardEntry,
  type ScoreSubmission
} from "./leaderboard";

function createShell() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="shell">
      <section class="stage-wrap">
        <div id="game" class="game"></div>
        <div class="hud">
          <div class="hud-meta">
            <div class="hud-stat"><span>점수</span><strong id="score">0</strong></div>
            <div class="hud-stat hud-gold"><span>골드</span><strong id="gold">0</strong></div>
          </div>
          <div class="hud-progress">
            <div class="stage-line">
              <span class="stage-badge">단계 <strong id="wave">1</strong></span>
              <strong id="stage-name" class="stage-name">달빛 장난감방</strong>
              <span id="wave-phase" class="wave-phase">I / 정찰</span>
            </div>
            <div class="kill-track" aria-label="보스 진행도">
              <i id="kill-progress"></i>
              <b class="kill-mark mark-25"></b>
              <b class="kill-mark mark-50"></b>
              <b class="kill-mark mark-75"></b>
            </div>
            <div class="progress-line">
              <strong id="boss-distance">막 I - 준비</strong>
              <span id="combo">처치 0</span>
            </div>
          </div>
          <div class="hud-vitals">
            <div class="hud-stat hud-lives"><span>생명력</span><strong id="lives">5/5</strong></div>
            <div id="hud-ammo" class="hud-stat hud-ammo">
              <span id="ammo-state">탄약</span><strong id="ammo-count">6/6</strong>
              <small id="cover-hp-text" class="cover-hp-text">엄폐 100/100</small>
              <i id="cover-hp-meter" class="cover-hp-meter" role="progressbar" aria-label="엄폐물 체력" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><b id="cover-hp-fill"></b></i>
            </div>
            <div class="hud-stat hud-bombs"><span>폭탄</span><strong id="dynamite-count">0</strong></div>
          </div>
        </div>
        <div id="kill-streak" class="kill-streak">연속 처치 <strong>x0</strong></div>
        <button id="brother-tag" class="brother-hud" type="button" aria-label="형제 교대">
          <span id="brother-name">파랑 / 정밀 사격</span>
          <i class="tag-track"><b id="tag-progress"></b></i>
          <small id="weapon-name">별빛 리볼버</small>
        </button>
        <div id="combat-synergy" class="combat-synergy" aria-live="polite">
          <span>공명 연계</span><strong>달빛 표식 없음</strong>
        </div>
        <div id="event-banner" class="event-banner" aria-live="polite"></div>
        <div id="hazard-overlay" class="hazard-overlay" aria-hidden="true"></div>
        <div id="damage-flash" class="damage-flash" aria-hidden="true"></div>
        <div id="status" class="status">결투 개시!</div>
        <div id="shop" class="shop hidden">
          <div class="shop-window">
            <h2 id="shop-title">상점</h2>
            <p id="shop-gold">골드 0</p>
            <p id="shop-build" class="shop-build">조합 효과 없음</p>
            <div id="stage-report" class="stage-report" aria-live="polite"></div>
            <div class="shop-grid">
              <button id="buy-damage" type="button"><i class="item-icon shotgun"></i><span>강화 화약</span><small>공격력 증가</small></button>
              <button id="buy-range" type="button"><i class="item-icon rifle"></i><span>장총열</span><small>범위 증가</small></button>
              <button id="buy-reload" type="button"><i class="item-icon gatling"></i><span>속사 방아쇠</span><small>재장전 단축</small></button>
              <button id="buy-pierce" type="button"><i class="item-icon rifle"></i><span>관통 장치</span><small>관통 증가</small></button>
              <button id="buy-life" type="button"><i class="item-icon potion"></i><span>강철 심장</span><small>최대 생명력 증가</small></button>
              <button id="buy-potion" type="button"><i class="item-icon potion"></i><span>회복 물약</span><small>생명력 2 회복</small></button>
              <button id="buy-dynamite" type="button"><i class="item-icon dynamite"></i><span>다이너마이트</span><small>화면 전체 공격 / 최대 3개</small></button>
            </div>
            <button id="continue-stage" class="continue" type="button">다음 단계</button>
          </div>
        </div>
        <div id="field-upgrade" class="field-upgrade hidden" aria-hidden="true">
          <div class="field-upgrade-window">
            <small>전투 구역 돌파</small>
            <h2>강화 부품 선택</h2>
            <p id="field-upgrade-copy">꿈 부품 하나를 회수하세요. 이번 도전이 끝날 때까지 유지됩니다.</p>
            <div id="field-upgrade-options" class="field-upgrade-options"></div>
          </div>
        </div>
        <div id="intro" class="intro">
          <div class="intro-art" role="img" aria-label="무무 브라더스 시작 화면"></div>
          <div class="intro-title">
            <small>꿈결 돌격</small>
            <strong>무무 브라더스</strong>
            <span>장난감방을 깨워라</span>
          </div>
          <div class="chapter-select" aria-label="챕터 선택">
            <button class="chapter-card" data-chapter="1" type="button">
              <span>페이즈 4 서막</span>
              <strong>꿈꾸는 장난감방</strong>
              <small>달빛 방에서 별고래 우편 항구까지 이어지는 꿈의 원정</small>
            </button>
            <button class="chapter-card" data-chapter="2" type="button">
              <span>고전 오락실</span>
              <strong>서부와 늪지대</strong>
              <small>기존 열 단계 도전</small>
            </button>
          </div>
          <div class="intro-actions">
            <button id="start-game" class="start-game" type="button">게임 시작</button>
            <button id="open-leaderboard" class="open-leaderboard" type="button">TOP 10</button>
          </div>
        </div>
        <div id="leaderboard" class="leaderboard-overlay hidden" aria-hidden="true">
          <section class="leaderboard-window" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
            <header class="leaderboard-header">
              <div>
                <small id="leaderboard-mode">공용 랭킹 연결 중</small>
                <h2 id="leaderboard-title">꿈 사수단 TOP 10</h2>
              </div>
              <button id="close-leaderboard" class="leaderboard-close" type="button" aria-label="랭킹 닫기">&times;</button>
            </header>
            <div id="leaderboard-result" class="leaderboard-result hidden">
              <span>이번 도전</span>
              <strong id="leaderboard-result-score">0점</strong>
              <small id="leaderboard-result-detail">1단계 · D등급</small>
            </div>
            <div class="leaderboard-columns" aria-hidden="true">
              <span>순위</span><span>꿈 사수</span><span>기록</span>
            </div>
            <ol id="leaderboard-list" class="leaderboard-list">
              <li class="leaderboard-empty">랭킹을 불러오는 중입니다</li>
            </ol>
            <form id="leaderboard-form" class="leaderboard-form">
              <label for="leaderboard-nickname">닉네임</label>
              <input id="leaderboard-nickname" maxlength="12" autocomplete="nickname" inputmode="text" />
              <button id="submit-leaderboard" type="submit">기록 등록</button>
            </form>
            <p id="leaderboard-message" class="leaderboard-message" aria-live="polite">게임 종료 후 최고 점수를 등록할 수 있습니다.</p>
          </section>
        </div>
        <div class="touch-controls" aria-label="터치 조작">
          <div class="touch-pad" aria-label="이동">
            <button class="touch-btn touch-up" data-move="up" type="button" aria-label="위로 이동">&#9650;</button>
            <button class="touch-btn touch-left" data-move="left" type="button" aria-label="왼쪽으로 이동">&#9664;</button>
            <button class="touch-btn touch-right" data-move="right" type="button" aria-label="오른쪽으로 이동">&#9654;</button>
            <button class="touch-btn touch-down" data-move="down" type="button" aria-label="아래로 이동">&#9660;</button>
          </div>
          <div class="touch-actions" aria-label="행동">
            <button id="touch-tag" class="touch-action tag" type="button">교대</button>
            <button id="touch-dynamite" class="touch-action dynamite" type="button">폭탄</button>
          </div>
        </div>
        <div class="rotate-notice" aria-label="가로 화면 안내">
          <span class="rotate-phone" aria-hidden="true"></span>
          <strong>가로 화면으로 돌려주세요</strong>
          <small>전투는 가로 화면에 맞춰져 있습니다</small>
        </div>
      </section>
      <aside class="panel">
        <h1>무무 브라더스</h1>
        <p>2.5D 엄폐 사격 꿈속 로그라이트</p>
        <div class="controls">
          <span>A/D 또는 방향키</span><b>이동</b>
          <span>마우스</span><b>조준</b>
          <span>적 터치 또는 Z/X/C/스페이스</span><b>발사</b>
          <span>손 떼기 / R</span><b>엄폐 및 재장전</b>
          <span>Q</span><b>형제 교대</b>
          <span>F</span><b>다이너마이트</b>
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
  phase4?: boolean;
  phase4EnemyTexture?: string;
  phase4BossTexture?: string;
};

type RangeBand = "near" | "mid" | "far";
type ToyRole = "bruiser" | "guard" | "sniper" | "shield" | "boss";
type PlayerPose = "cover" | "aim" | "fire" | "reload";
type DreamPartKind = "moonChoke" | "starCylinder" | "cometHammer" | "dreamGrip";
type LootRarity = "common" | "rare" | "epic" | "legendary";

type DreamLootChoice = {
  kind: DreamPartKind;
  rarity: LootRarity;
  gain: number;
};

type Enemy = {
  sprite: Phaser.GameObjects.Container;
  visual?: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Rectangle;
  glow?: Phaser.Filters.Glow;
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
  weakOffsetY?: number;
  aimGuide?: Phaser.GameObjects.Rectangle;
  warning: Phaser.GameObjects.Arc;
  threat: EnemyThreat;
  bounty: boolean;
  alive: boolean;
  rangeBand?: RangeBand;
  rangeScale?: number;
  role?: ToyRole;
  armor?: number;
  maxArmor?: number;
  breakValue?: number;
  maxBreak?: number;
  brokenUntil?: number;
  healthBar?: Phaser.GameObjects.Rectangle;
  armorBar?: Phaser.GameObjects.Rectangle;
  breakBar?: Phaser.GameObjects.Rectangle;
  rangeBadge?: Phaser.GameObjects.Text;
  statusBadge?: Phaser.GameObjects.Text;
  moonMarkedUntil?: number;
  burnStacks?: number;
  burnUntil?: number;
  nextBurnTick?: number;
};

type EnemyPattern = "shooter" | "charger" | "tank" | "skirmisher" | "trickster";
type EnemyThreat = "normal" | "red" | "yellow" | "purple";
type EnemyProjectileKind = "star" | "orb" | "comet" | "nightmare";
type Brother = "blue" | "red";
type EventKind = "wanted" | "ambush" | "goldRush" | "darkness" | "deadeye";
type DamageSource = "shot" | "dynamite" | "assist" | "hazard" | "explosion" | "status";
type FieldUpgradeKind = "highCaliber" | "speedLoader" | "longCylinder" | "quickdraw" | "deadeyeGlass" | "quickstep" | "bountyRounds" | "piercingRounds";

type StageReport = {
  grade: "S" | "A" | "B" | "C";
  accuracy: number;
  maxCombo: number;
  damageTaken: number;
  clearTime: number;
  eliteKills: number;
  coreBreaks: number;
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
  sprite: Phaser.GameObjects.Container;
  visual: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  piercesCover: boolean;
  life: number;
  initialLife: number;
  radius: number;
  kind: EnemyProjectileKind;
  startScale: number;
  endScale: number;
  trailCooldown: number;
  damage?: number;
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

const WAVE_ACTS = [
  { numeral: "I", name: "정찰", cap: 7, spawnDelay: 760, duration: 35000, callout: "사냥이 시작된다" },
  { numeral: "II", name: "십자포화", cap: 9, spawnDelay: 560, duration: 45000, callout: "십자포화" },
  { numeral: "III", name: "최후의 저항", cap: 12, spawnDelay: 380, duration: 50000, callout: "정예 적 출현" }
] as const;

const PHASE4_STAGE_QUOTAS = [
  [4, 5, 3],
  [5, 6, 4],
  [6, 7, 5],
  [7, 8, 6]
] as const;
const PHASE4_STAGE_BALANCE = [
  { hp: 1, armor: 1, break: 1, speed: 1, fireDelay: 1 },
  { hp: 1.5, armor: 1.35, break: 1.25, speed: 1.06, fireDelay: 0.93 },
  { hp: 2.15, armor: 1.8, break: 1.55, speed: 1.11, fireDelay: 0.86 },
  { hp: 3, armor: 2.3, break: 1.9, speed: 1.16, fireDelay: 0.79 }
] as const;
const PHASE4_WORKSHOP_UPGRADE_LIMIT = 2;
const DREAM_STAGE_COUNT = PHASE4_STAGE_QUOTAS.length;
const PHASE4_PLAYER_SIZE = 154;
const PHASE4_COVER_DEPTH = 7;
const PHASE4_PLAYER_DEPTH = 7.2;
const PHASE4_COVER_FRONT_DEPTH = 7.4;
const PHASE4_PLAYER_AIM_Y = 0;

const RANGE_STYLE: Record<RangeBand, { y: number; scale: number; color: number; label: string }> = {
  far: { y: 220, scale: 0.64, color: 0xb58cff, label: "원거리" },
  mid: { y: 314, scale: 0.82, color: 0x64e9ff, label: "중거리" },
  near: { y: 394, scale: 1.06, color: 0xff9b6a, label: "근거리" }
};

const DREAM_PARTS: Record<DreamPartKind, { label: string; detail: string; frame: string; max: number }> = {
  moonChoke: { label: "달빛 초크", detail: "산탄 사거리와 명중 범위 증가", frame: "partMoonChoke", max: 3 },
  starCylinder: { label: "별빛 탄창", detail: "장탄 수 +2, 붕괴 피해 증가", frame: "partStarCylinder", max: 3 },
  cometHammer: { label: "혜성 해머", detail: "공격력과 연사 속도 증가", frame: "partCometHammer", max: 3 },
  dreamGrip: { label: "꿈결 손잡이", detail: "재장전 단축, 엄폐물 수리", frame: "partDreamGrip", max: 3 }
};

const LOOT_RARITIES: Record<LootRarity, { label: string; resonance: number; gain: number }> = {
  common: { label: "일반", resonance: 0, gain: 1 },
  rare: { label: "희귀", resonance: 1, gain: 1 },
  epic: { label: "영웅", resonance: 2, gain: 2 },
  legendary: { label: "전설", resonance: 4, gain: 3 }
};

const freshDreamParts = (): Record<DreamPartKind, number> => ({
  moonChoke: 0,
  starCylinder: 0,
  cometHammer: 0,
  dreamGrip: 0
});

const PHASE4_ASSETS = [
  ["phase4DreamBackground", "/assets/phase4/dream-bedroom-stage.png"],
  ["phase4Blue", "/assets/phase4/blue-mumu-poses.png"],
  ["phase4Red", "/assets/phase4/red-mumu-poses.png"],
  ["phase4Toys", "/assets/phase4/glitch-toys.png"],
  ["phase4Boss", "/assets/phase4/nightmare-toymaster.png"],
  ["phase4Cover", "/assets/phase4/dream-cover.png"],
  ["phase4Parts", "/assets/phase4/dream-parts.png"],
  ["phase4Projectiles", "/assets/phase4/enemy-projectiles.png"],
  ["phase4WorkshopBackground", "/assets/phase4/stage2-star-toyworks-v1.png"],
  ["phase4WorkshopToys", "/assets/phase4/stage2-toys-v1.png"],
  ["phase4WorkshopBoss", "/assets/phase4/stage2-gear-master-v1.png"],
  ["phase4LibraryBackground", "/assets/phase4/stage3-cloud-library-v1.png"],
  ["phase4LibraryToys", "/assets/phase4/stage3-storybook-toys-v1.png"],
  ["phase4LibraryBoss", "/assets/phase4/stage3-ink-librarian-v1.png"],
  ["phase4HarborBackground", "/assets/phase4/stage4-starwhale-harbor-v1.png"],
  ["phase4HarborToys", "/assets/phase4/stage4-postal-enemies-v1.png"],
  ["phase4HarborBoss", "/assets/phase4/stage4-tempest-admiral-v1.png"]
] as const;

const FIELD_UPGRADES: Record<FieldUpgradeKind, { label: string; detail: string; icon: string; max: number }> = {
  highCaliber: { label: "대구경탄", detail: "사격 피해 +1", icon: "shotgun", max: 3 },
  speedLoader: { label: "고속 장전기", detail: "재장전 시간 14% 단축", icon: "gatling", max: 3 },
  longCylinder: { label: "확장 탄창", detail: "장탄 수 +2", icon: "rifle", max: 3 },
  quickdraw: { label: "속사", detail: "발사 속도 12% 증가", icon: "gatling", max: 3 },
  deadeyeGlass: { label: "약점 조준경", detail: "약점 피해 50% 증가", icon: "potion", max: 3 },
  quickstep: { label: "민첩한 발걸음", detail: "이동 속도 12% 증가", icon: "dynamite", max: 3 },
  bountyRounds: { label: "현상금 탄환", detail: "처치 시 골드 +1", icon: "shotgun", max: 3 },
  piercingRounds: { label: "관통탄", detail: "관통 대상 +1", icon: "rifle", max: 3 }
};

const freshFieldUpgrades = (): Record<FieldUpgradeKind, number> => ({
  highCaliber: 0,
  speedLoader: 0,
  longCylinder: 0,
  quickdraw: 0,
  deadeyeGlass: 0,
  quickstep: 0,
  bountyRounds: 0,
  piercingRounds: 0
});

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
  { name: "달빛 장난감방", skyTop: 0x11152e, skyBottom: 0x403476, ground: 0x27223f, trim: 0x77ecff, accent: 0xc06cff, signs: ["꿈", "놀이", "기상"], prop: "crate", motif: "night", bossName: "악몽의 장난감 지배자", enemyTint: 0xffffff, bossTint: 0x77ecff, wash: 0.02, background: "phase4DreamBackground", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff", bossSprite: "marshalBragg", phase4: true },
  { name: "별빛 장난감 공방", skyTop: 0x0b1730, skyBottom: 0x174966, ground: 0x4e3928, trim: 0x75efff, accent: 0xffc75c, signs: ["공방", "태엽", "별빛"], prop: "crate", motif: "night", bossName: "대태엽 장인", enemyTint: 0xffffff, bossTint: 0x75efff, wash: 0.025, background: "phase4WorkshopBackground", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff", bossSprite: "cactusJack", phase4: true, phase4EnemyTexture: "phase4WorkshopToys", phase4BossTexture: "phase4WorkshopBoss" },
  { name: "구름별 꿈책 도서관", skyTop: 0x17366f, skyBottom: 0x8fcdf4, ground: 0x8a563d, trim: 0x8feeff, accent: 0xff7fb7, signs: ["이야기", "별잉크", "책장"], prop: "crate", motif: "night", bossName: "잉크별 대사서", enemyTint: 0xffffff, bossTint: 0xff8de1, wash: 0.018, background: "phase4LibraryBackground", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff", bossSprite: "ironBelle", phase4: true, phase4EnemyTexture: "phase4LibraryToys", phase4BossTexture: "phase4LibraryBoss" },
  { name: "별고래 우편 항구", skyTop: 0x6ba9dc, skyBottom: 0xffc983, ground: 0x855139, trim: 0x6eefff, accent: 0xff766f, signs: ["항구", "우편", "별고래"], prop: "crate", motif: "night", bossName: "폭풍우편 제독", enemyTint: 0xffffff, bossTint: 0xff806f, wash: 0.014, background: "phase4HarborBackground", enemyPool: ["maskedOutlaw", "rifleDesperado"], bossEnemy: "armoredSheriff", bossSprite: "coalBaron", phase4: true, phase4EnemyTexture: "phase4HarborToys", phase4BossTexture: "phase4HarborBoss" },
  { name: "무법자 마을", skyTop: 0x120e16, skyBottom: 0x5a2532, ground: 0x5e3732, trim: 0xffcc6d, accent: 0x9f2525, signs: ["보스", "피", "종말"], prop: "lantern", motif: "fort", bossName: "마지막 형제", enemyTint: 0xffffff, bossTint: 0xff3c3c, wash: 0.06, background: "stageBackground5", enemyPool: ["vampireCowboy", "demonOutlaw", "armoredSheriff"], bossEnemy: "demonOutlaw", bossSprite: "lastBrother" },
  { name: "저주받은 늪지 전초기지", skyTop: 0x10251d, skyBottom: 0x2e6a4d, ground: 0x314024, trim: 0x9adf8e, accent: 0x5bcf80, signs: ["늪", "선착장", "개구리"], prop: "lantern", motif: "river", bossName: "악어왕", enemyTint: 0xffffff, bossTint: 0x8cff7a, wash: 0.06, background: "stageBackground6", enemyPool: ["swampZombie", "gatorOutlaw", "poisonFrog"], bossEnemy: "gatorOutlaw", bossSprite: "gatorKing" },
  { name: "마녀불 늪지", skyTop: 0x140d25, skyBottom: 0x295b37, ground: 0x263820, trim: 0xd7a75b, accent: 0x8d55c7, signs: ["늪지", "저주", "뼈"], prop: "lantern", motif: "night", bossName: "촛불 마녀 여왕", enemyTint: 0xffffff, bossTint: 0xd98cff, wash: 0.07, background: "stageBackground7", enemyPool: ["wispGunslinger", "voodooMask", "mossWitch"], bossEnemy: "mossWitch", bossSprite: "candleWitch" },
  { name: "증기선 공동묘지", skyTop: 0x10222b, skyBottom: 0x27605c, ground: 0x35412f, trim: 0x8fe5d2, accent: 0xb4773e, signs: ["강", "난파", "사슬"], prop: "crate", motif: "river", bossName: "증기선 망령", enemyTint: 0xffffff, bossTint: 0x9effee, wash: 0.06, background: "stageBackground8", enemyPool: ["skeletalFerryman", "leechMutant", "mosquitoGunslinger"], bossEnemy: "skeletalFerryman", bossSprite: "steamboatRevenant" },
  { name: "부두 뼈 시장", skyTop: 0x1b1021, skyBottom: 0x3a5730, ground: 0x3b3023, trim: 0xffd176, accent: 0xb35ad8, signs: ["가면", "부적", "약탕"], prop: "barrel", motif: "night", bossName: "뼈 시장 남작", enemyTint: 0xffffff, bossTint: 0xffd176, wash: 0.07, background: "stageBackground9", enemyPool: ["voodooMask", "boneAlligator", "poisonFrog"], bossEnemy: "voodooMask", bossSprite: "boneMarketBaron" },
  { name: "심장뿌리 늪", skyTop: 0x0b1110, skyBottom: 0x1d5a35, ground: 0x223421, trim: 0x7aff9e, accent: 0x23d276, signs: ["뿌리", "저주", "종말"], prop: "ore", motif: "fort", bossName: "심장뿌리 거대수", enemyTint: 0xffffff, bossTint: 0x7aff9e, wash: 0.08, background: "stageBackground10", enemyPool: ["mossWitch", "wispGunslinger", "leechMutant", "boneAlligator"], bossEnemy: "boneAlligator", bossSprite: "heartrootLeviathan" }
];

class MumuBrothersScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private playerCover?: Phaser.GameObjects.Image;
  private playerCoverFront?: Phaser.GameObjects.Image;
  private playerPose: PlayerPose = "cover";
  private coverHp = 100;
  private maxCoverHp = 100;
  private coverBrokenUntil = 0;
  private coverInvulnerableUntil = 0;
  private readonly coverRepairDuration = 4200;
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
  private workshopUpgradesPurchased = 0;
  private workshopUpgradeKindsPurchased = new Set<"damage" | "range" | "reload" | "pierce" | "life">();
  private fieldUpgrades = freshFieldUpgrades();
  private dreamParts = freshDreamParts();
  private ammo = 6;
  private reloading = false;
  private reloadUntil = 0;
  private covering = true;
  private coverReadyAt = 0;
  private lastShotAt = 0;
  private isPointerDown = false;
  private touchMove = { x: 0, y: 0 };
  private activeTouchMoves = new Set<string>();
  private nextPlayerShot = 0;
  private nextEnemyShot = 0;
  private nextSpawn = 0;
  private nextEliteKill = 25;
  private waveAct = 1;
  private actStartedAt = 0;
  private actEndsAt = 0;
  private actTransitioning = false;
  private inFieldUpgrade = false;
  private fieldUpgradeChoices: FieldUpgradeKind[] = [];
  private dreamPartChoices: DreamLootChoice[] = [];
  private dreamResonance = 0;
  private bestLootRank = 0;
  private bossLootSummary = "";
  private actSpawned = 0;
  private actDefeated = 0;
  private nextHudTick = 0;
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
  private stageCoreBreaks = 0;
  private stageDreamBursts = 0;
  private stageReport?: StageReport;
  private runCompletePending = false;
  private runStartedAt = 0;
  private leaderboardOpen = false;
  private leaderboardSubmission?: ScoreSubmission;
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
  private ammoText!: HTMLElement;
  private ammoStateText!: HTMLElement;
  private ammoHud!: HTMLElement;
  private coverHpText!: HTMLElement;
  private coverHpMeter!: HTMLElement;
  private coverHpFill!: HTMLElement;
  private killStreakText!: HTMLElement;
  private brotherTagButton!: HTMLButtonElement;
  private brotherNameText!: HTMLElement;
  private tagProgress!: HTMLElement;
  private weaponNameText!: HTMLElement;
  private combatSynergyText!: HTMLElement;
  private combatSynergyValueText!: HTMLElement;
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
  private fieldUpgradeOverlay!: HTMLElement;
  private fieldUpgradeOptions!: HTMLElement;
  private introOverlay!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private openLeaderboardButton!: HTMLButtonElement;
  private leaderboardOverlay!: HTMLElement;
  private leaderboardModeText!: HTMLElement;
  private leaderboardResult!: HTMLElement;
  private leaderboardResultScore!: HTMLElement;
  private leaderboardResultDetail!: HTMLElement;
  private leaderboardList!: HTMLOListElement;
  private leaderboardForm!: HTMLFormElement;
  private leaderboardNickname!: HTMLInputElement;
  private leaderboardSubmitButton!: HTMLButtonElement;
  private leaderboardMessage!: HTMLElement;
  private closeLeaderboardButton!: HTMLButtonElement;
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
  private reticleThreat: EnemyThreat = "normal";
  private reticleRange?: RangeBand;
  private coverIndicator!: Phaser.GameObjects.Text;
  private sceneVignette?: Phaser.Filters.Vignette;
  private sceneColorGrade?: Phaser.Filters.ColorMatrix;
  private scenePixelate?: Phaser.Filters.Pixelate;
  private sceneBarrel?: Phaser.Filters.Barrel;
  private vignetteMood = "";

  constructor() {
    super("mumu-brothers");
  }

  preload() {
    this.load.image("mvpSprites", "/assets/mvp-sprites.png");
    for (const [key, path] of PHASE4_ASSETS) this.load.image(key, path);
    const initialStage = this.startStageFromParams();
    if (initialStage !== 1) {
      const [backgroundKey, backgroundPath] = STAGE_BACKGROUND_ASSETS[initialStage - 1];
      this.load.image(backgroundKey, backgroundPath);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#191310");
    this.applyStartParams();
    this.setupPhaser4Rendering();
    this.createHud();
    this.registerSpriteFrames();
    this.createWorld();
    this.createPlayer();
    this.createReticle();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,Z,X,C,F,Q,SPACE,ENTER,R,ONE,TWO,THREE") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.reticle.setPosition(pointer.x, pointer.y));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted) return;
      if (this.waitingForContinue) {
        this.continueGame();
        return;
      }
      this.isPointerDown = true;
      this.reticle.setPosition(pointer.x, pointer.y);
      if (!this.reloading) this.leaveCover();
      this.shoot();
    });
    const releaseFire = () => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      this.enterCover();
      this.startReload();
    };
    this.input.on("pointerup", releaseFire);
    this.input.on("pointerupoutside", releaseFire);
    this.game.canvas.addEventListener("pointercancel", releaseFire);
    window.addEventListener("pointerup", releaseFire);
    window.addEventListener("blur", releaseFire);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.canvas.removeEventListener("pointercancel", releaseFire);
      window.removeEventListener("pointerup", releaseFire);
      window.removeEventListener("blur", releaseFire);
    });
    this.updateHud();
  }

  update(_time: number, delta: number) {
    const time = this.time.now;
    if (this.leaderboardOpen) return;
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

    this.updateReloadState(time);
    this.updateCoverState(time);
    if (this.inFieldUpgrade) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.chooseFieldUpgrade(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.chooseFieldUpgrade(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.chooseFieldUpgrade(2);
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.enterCover();
      this.startReload();
    }
    if (
      !this.isPointerDown &&
      !this.reloading &&
      !this.covering &&
      time >= this.lastShotAt + 260 &&
      (!this.phase4Mode() || time >= this.coverBrokenUntil)
    ) {
      this.enterCover();
    }

    const act = WAVE_ACTS[this.waveAct - 1];
    const activeCap = this.phase4Mode() ? 3 : act.cap;
    const liveEnemyCount = this.enemies.filter((enemy) => enemy.alive).length;
    const canSpawnPhase4 = !this.phase4Mode() || this.actSpawned < this.phase4Quota();
    if (!this.bossSpawned && !this.actTransitioning && canSpawnPhase4 && time > this.nextSpawn && liveEnemyCount < activeCap) {
      this.spawnEnemy();
      this.nextSpawn = time + (this.phase4Mode() ? 850 : Math.max(280, act.spawnDelay - this.wave * 12));
    }

    this.updateEnemies(time, delta);
    this.updateBullets(delta);
    this.updateStageSystems(time);
    this.updateReticleLock();
    this.updateCombatMood(time);
    if (time >= this.nextHudTick) {
      this.nextHudTick = time + 180;
      this.updateHud();
    }
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
    this.ammoText = document.querySelector("#ammo-count")!;
    this.ammoStateText = document.querySelector("#ammo-state")!;
    this.ammoHud = document.querySelector("#hud-ammo")!;
    this.coverHpText = document.querySelector("#cover-hp-text")!;
    this.coverHpMeter = document.querySelector("#cover-hp-meter")!;
    this.coverHpFill = document.querySelector("#cover-hp-fill")!;
    this.killStreakText = document.querySelector("#kill-streak")!;
    this.brotherTagButton = document.querySelector("#brother-tag")!;
    this.brotherNameText = document.querySelector("#brother-name")!;
    this.tagProgress = document.querySelector("#tag-progress")!;
    this.weaponNameText = document.querySelector("#weapon-name")!;
    this.combatSynergyText = document.querySelector("#combat-synergy")!;
    this.combatSynergyValueText = this.combatSynergyText.querySelector("strong")!;
    this.eventBanner = document.querySelector("#event-banner")!;
    this.hazardOverlay = document.querySelector("#hazard-overlay")!;
    this.damageFlash = document.querySelector("#damage-flash")!;
    this.statusText = document.querySelector("#status")!;
    this.shopOverlay = document.querySelector("#shop")!;
    this.shopTitle = document.querySelector("#shop-title")!;
    this.shopGoldText = document.querySelector("#shop-gold")!;
    this.shopBuildText = document.querySelector("#shop-build")!;
    this.stageReportText = document.querySelector("#stage-report")!;
    this.fieldUpgradeOverlay = document.querySelector("#field-upgrade")!;
    this.fieldUpgradeOptions = document.querySelector("#field-upgrade-options")!;
    this.introOverlay = document.querySelector("#intro")!;
    this.startButton = document.querySelector("#start-game")!;
    this.openLeaderboardButton = document.querySelector("#open-leaderboard")!;
    this.leaderboardOverlay = document.querySelector("#leaderboard")!;
    this.leaderboardModeText = document.querySelector("#leaderboard-mode")!;
    this.leaderboardResult = document.querySelector("#leaderboard-result")!;
    this.leaderboardResultScore = document.querySelector("#leaderboard-result-score")!;
    this.leaderboardResultDetail = document.querySelector("#leaderboard-result-detail")!;
    this.leaderboardList = document.querySelector("#leaderboard-list")!;
    this.leaderboardForm = document.querySelector("#leaderboard-form")!;
    this.leaderboardNickname = document.querySelector("#leaderboard-nickname")!;
    this.leaderboardSubmitButton = document.querySelector("#submit-leaderboard")!;
    this.leaderboardMessage = document.querySelector("#leaderboard-message")!;
    this.closeLeaderboardButton = document.querySelector("#close-leaderboard")!;
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
    this.openLeaderboardButton.addEventListener("click", () => void this.openLeaderboard());
    this.closeLeaderboardButton.addEventListener("click", () => this.closeLeaderboard());
    this.leaderboardOverlay.addEventListener("click", (event) => {
      if (event.target === this.leaderboardOverlay) this.closeLeaderboard();
    });
    this.leaderboardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submitLeaderboard();
    });
    this.leaderboardNickname.value = getLeaderboardNickname();
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

  private buildLeaderboardSubmission(cleared: boolean): ScoreSubmission {
    return {
      score: this.score,
      stage: this.wave,
      chapter: this.chapterForStage(this.wave),
      grade: this.weaponGrade(),
      cleared,
      elapsedMs: Math.max(0, this.time.now - this.runStartedAt)
    };
  }

  private async openLeaderboard(submission?: ScoreSubmission) {
    if (submission) this.leaderboardSubmission = submission;
    this.leaderboardOpen = true;
    this.isPointerDown = false;
    this.enterCover();
    this.leaderboardOverlay.classList.remove("hidden");
    this.leaderboardOverlay.setAttribute("aria-hidden", "false");
    this.leaderboardNickname.value = getLeaderboardNickname();
    this.leaderboardSubmitButton.disabled = !this.leaderboardSubmission;
    this.leaderboardForm.classList.toggle("disabled", !this.leaderboardSubmission);
    this.leaderboardResult.classList.toggle("hidden", !this.leaderboardSubmission);
    if (this.leaderboardSubmission) {
      const result = this.leaderboardSubmission;
      this.leaderboardResultScore.textContent = `${result.score.toLocaleString("ko-KR")}점`;
      this.leaderboardResultDetail.textContent =
        `${result.stage}단계 · ${result.grade}등급${result.cleared ? " · 꿈 원정 완료" : ""}`;
      this.leaderboardMessage.textContent = "닉네임을 확인하고 이번 최고 기록을 등록하세요.";
    } else {
      this.leaderboardMessage.textContent = "게임 종료 후 최고 점수를 등록할 수 있습니다.";
    }
    this.leaderboardList.replaceChildren(this.makeLeaderboardMessage("랭킹을 불러오는 중입니다"));
    const snapshot = await loadLeaderboard();
    if (!this.leaderboardOpen) return;
    this.renderLeaderboardEntries(snapshot.entries);
    this.leaderboardModeText.textContent = snapshot.source === "online" ? "온라인 공용 랭킹" : "이 기기의 로컬 랭킹";
    this.leaderboardModeText.classList.toggle("online", snapshot.source === "online");
  }

  private closeLeaderboard() {
    this.leaderboardOpen = false;
    this.leaderboardOverlay.classList.add("hidden");
    this.leaderboardOverlay.setAttribute("aria-hidden", "true");
  }

  private async submitLeaderboard() {
    if (!this.leaderboardSubmission || this.leaderboardSubmitButton.disabled) return;
    this.leaderboardSubmitButton.disabled = true;
    this.leaderboardNickname.disabled = true;
    this.leaderboardMessage.textContent = "최고 기록을 등록하는 중입니다.";
    const nickname = this.leaderboardNickname.value;
    try {
      const snapshot = await submitLeaderboardScore(this.leaderboardSubmission, nickname);
      this.leaderboardNickname.value = getLeaderboardNickname();
      this.renderLeaderboardEntries(snapshot.entries, this.leaderboardSubmission.score);
      this.leaderboardModeText.textContent = snapshot.source === "online" ? "온라인 공용 랭킹" : "로컬 저장 · 서버 연결 대기";
      this.leaderboardModeText.classList.toggle("online", snapshot.source === "online");
      this.leaderboardMessage.textContent = snapshot.source === "online"
        ? "기록 등록 완료! 최고 기록만 랭킹에 남습니다."
        : "기록은 이 기기에 저장했습니다. Apps Script 업데이트 후 온라인에 연결됩니다.";
    } finally {
      this.leaderboardNickname.disabled = false;
      this.leaderboardSubmitButton.disabled = false;
    }
  }

  private renderLeaderboardEntries(entries: LeaderboardEntry[], currentScore?: number) {
    this.leaderboardList.replaceChildren();
    if (entries.length === 0) {
      this.leaderboardList.append(this.makeLeaderboardMessage("아직 등록된 꿈 사수가 없습니다"));
      return;
    }
    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      if (entry.nickname === getLeaderboardNickname() && entry.score === currentScore) item.classList.add("mine");

      const rank = document.createElement("b");
      rank.textContent = String(index + 1);

      const player = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = entry.nickname;
      const detail = document.createElement("small");
      detail.textContent = `${entry.stage}단계 · ${entry.grade}등급${entry.cleared ? " · 완료" : ""}`;
      player.append(name, detail);

      const score = document.createElement("em");
      score.textContent = entry.score.toLocaleString("ko-KR");
      item.append(rank, player, score);
      this.leaderboardList.append(item);
    });
  }

  private makeLeaderboardMessage(message: string) {
    const item = document.createElement("li");
    item.className = "leaderboard-empty";
    item.textContent = message;
    return item;
  }

  private setupPhaser4Rendering() {
    if (this.game.renderer.type !== Phaser.WEBGL) return;
    const filters = this.cameras.main.filters.internal;
    this.sceneColorGrade = filters.addColorMatrix();
    this.sceneVignette = filters.addVignette(0.5, 0.52, 0.62, 0.18, 0x08070a);
    this.scenePixelate = filters.addPixelate(0);
    this.scenePixelate.active = false;
    this.sceneBarrel = filters.addBarrel(1);
    this.sceneBarrel.active = false;
    this.applyStageColorGrade();
  }

  private applyStageColorGrade(eventKind = this.activeEvent?.kind) {
    if (!this.sceneColorGrade) return;
    const matrix = this.sceneColorGrade.colorMatrix;
    matrix.reset();
    matrix.saturate(this.chapterForStage(this.wave) === 2 ? 0.2 : 0.12);
    matrix.contrast(0.08, true);
    if (eventKind === "darkness") matrix.saturate(-0.28, true);
    if (eventKind === "goldRush") matrix.hue(7, true);
    if (eventKind === "deadeye") matrix.contrast(0.08, true);
  }

  private updateCombatMood(time: number) {
    if (!this.sceneVignette) return;
    const boss = this.enemies.find((enemy) => enemy.alive && enemy.isBoss);
    const danger = 1 - Phaser.Math.Clamp(this.lives / Math.max(1, this.maxLives), 0, 1);
    const rage = boss?.bossPhase === 2 ? 0.12 : 0;
    const eventPulse = this.activeEvent ? (Math.sin(time / 210) + 1) * 0.018 : 0;
    this.sceneVignette.strength = 0.16 + danger * 0.2 + rage + eventPulse;
    this.sceneVignette.radius = 0.64 - danger * 0.08 - rage * 0.12;

    const mood = boss?.bossPhase === 2
      ? "rage"
      : this.lives <= 1
        ? "danger"
        : this.activeEvent?.kind ?? "normal";
    if (mood === this.vignetteMood) return;
    this.vignetteMood = mood;
    const color = mood === "rage"
      ? this.currentTheme().accent
      : mood === "danger"
        ? 0x4d0909
        : mood === "darkness"
          ? 0x210b38
          : mood === "goldRush"
            ? 0x4f3108
            : 0x08070a;
    this.sceneVignette.setColor(color);
  }

  private punchCameraFilter(pixelAmount: number, barrelAmount: number, duration = 420) {
    if (this.scenePixelate) {
      this.tweens.killTweensOf(this.scenePixelate);
      this.scenePixelate.amount = pixelAmount;
      this.scenePixelate.active = true;
      this.tweens.add({
        targets: this.scenePixelate,
        amount: 0,
        duration,
        ease: "Cubic.easeOut",
        onComplete: () => {
          if (this.scenePixelate) this.scenePixelate.active = false;
        }
      });
    }
    if (this.sceneBarrel) {
      this.tweens.killTweensOf(this.sceneBarrel);
      this.sceneBarrel.amount = barrelAmount;
      this.sceneBarrel.active = true;
      this.tweens.add({
        targets: this.sceneBarrel,
        amount: 1,
        duration,
        ease: "Back.easeOut",
        onComplete: () => {
          if (this.sceneBarrel) this.sceneBarrel.active = false;
        }
      });
    }
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
    if (this.phase4Mode()) this.setPlayerPose(this.covering ? "cover" : "aim");
    else this.playerSprite.setFrame(this.activeBrother === "blue" ? "heroBlue" : "heroRed").setDisplaySize(104, 112);
    this.cameras.main.flash(90, this.activeBrother === "blue" ? 70 : 190, 80, this.activeBrother === "blue" ? 210 : 60);
    this.updateHud(this.activeBrother === "blue" ? "파랑 - 정밀 사격" : "빨강 - 산탄 사격");
  }

  private callBrotherAssist() {
    const support = this.phase4Mode()
      ? this.add.image(-90, 350, this.activeBrother === "blue" ? "phase4Red" : "phase4Blue", this.activeBrother === "blue" ? "redFire" : "blueFire").setDisplaySize(188, 188).setDepth(14)
      : this.sheetSprite(-90, 360, this.activeBrother === "blue" ? "heroRed" : "heroBlue", 104, 112).setDepth(14);
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
    this.showStatus("형제 협동 공격!", "act", 1200);
  }

  private startGame() {
    if (this.gameStarted || this.loadingChapter) return;
    const chapter = this.chapterForStage(this.wave);
    this.ensureChapterLoaded(chapter, () => this.beginGame());
  }

  private beginGame() {
    this.gameStarted = true;
    this.runStartedAt = this.time.now;
    this.introOverlay.classList.add("hidden");
    this.spawnWave();
    this.updateHud(this.stageTitle());
    const params = new URLSearchParams(window.location.search);
    if (params.get("boss") === "1") {
      this.spawnBoss();
    }
    if (params.get("synergy") === "1") {
      const boss = this.enemies.find((enemy) => enemy.alive && enemy.isBoss);
      if (boss) {
        boss.weakUntil = this.time.now + 60000;
        boss.nextShot = this.time.now + 60000;
        boss.nextSpecial = this.time.now + 60000;
        boss.speed = 0;
        boss.weakpoint?.setVisible(true);
      }
    }
    const requestedEvent = params.get("event") as EventKind | null;
    if (requestedEvent && STAGE_EVENTS.includes(requestedEvent)) this.startStageEvent(requestedEvent);
    if (params.get("shop") === "1") {
      this.gold = Math.max(this.gold, 30);
      this.openShop();
    }
    if (params.get("upgrade") === "1") {
      this.clearCombat();
      this.actTransitioning = true;
      this.openFieldUpgrade();
    }
  }

  private selectChapter(chapter: number) {
    if (this.gameStarted) return;
    this.wave = chapter === 2 ? 6 : 1;
    this.refreshChapterSelect();
    this.updateHud(chapter === 2 ? "챕터 2 준비 완료" : "챕터 1 준비 완료");
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
    this.startButton.textContent = `챕터 ${chapter} 불러오는 중`;
    this.continueButton.textContent = `챕터 ${chapter} 불러오는 중`;
    this.updateHud(`챕터 ${chapter} 불러오는 중`);
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

    if (this.phase4Mode()) {
      const rangeGuide = this.track(this.add.graphics()).setDepth(1);
      rangeGuide.lineStyle(2, 0x8beaff, 0.14);
      rangeGuide.strokeLineShape(new Phaser.Geom.Line(54, 252, 906, 252));
      rangeGuide.strokeLineShape(new Phaser.Geom.Line(24, 346, 936, 346));
      rangeGuide.fillStyle(0x8beaff, 0.035);
      rangeGuide.fillRect(0, 346, 960, 86);
      (["far", "mid", "near"] as RangeBand[]).forEach((band) => {
        const style = RANGE_STYLE[band];
        const badge = this.track(this.add.text(18, style.y - 42, style.label, {
          color: `#${style.color.toString(16).padStart(6, "0")}`,
          fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          stroke: "#10131f",
          strokeThickness: 3
        }).setDepth(2));
        badge.setAlpha(0.68);
      });
      this.applyStageColorGrade();
      return;
    }

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
    this.applyStageColorGrade();
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
          fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
          fontSize: "18px",
          fontStyle: "bold"
        })
        .setOrigin(0.5)
    );
  }

  private createPlayer() {
    this.player = this.add.container(480, 442);
    this.player.setDepth(this.phase4Mode() ? PHASE4_PLAYER_DEPTH : 5);
    const shadow = this.add.ellipse(0, 30, this.phase4Mode() ? 76 : 74, 18, 0x000000, 0.32);
    this.playerSprite = this.phase4Mode()
      ? this.add.image(0, -35, "phase4Blue", "blueCover").setDisplaySize(PHASE4_PLAYER_SIZE, PHASE4_PLAYER_SIZE)
      : this.sheetSprite(0, -20, "heroBlue", 104, 112);
    this.player.add([shadow, this.playerSprite]);
    this.playerBody = this.add.rectangle(480, 442, 48, 88, 0xffffff, 0).setDepth(5);
    if (this.phase4Mode()) {
      const coverFrame = this.textures.getFrame("phase4Cover");
      const coverSplitY = Math.round(coverFrame.height * 0.28);
      this.playerCover = this.add
        .image(480, 477, "phase4Cover")
        .setDisplaySize(340, 121)
        .setDepth(PHASE4_COVER_DEPTH)
        .setCrop(0, 0, coverFrame.width, coverSplitY);
      this.playerCoverFront = this.add
        .image(480, 477, "phase4Cover")
        .setDisplaySize(340, 121)
        .setDepth(PHASE4_COVER_FRONT_DEPTH)
        .setCrop(0, coverSplitY, coverFrame.width, coverFrame.height - coverSplitY);
      this.playerBody.setSize(44, 64);
      this.setPlayerPose("cover");
    }
    this.coverIndicator = this.add
      .text(480, 378, "엄폐", {
        color: "#9af2ff",
        fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        stroke: "#10232a",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.coverIndicator.setVisible(!this.phase4Mode());
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
    const lockedEnemy = this.enemies.find(
      (enemy) => enemy.alive && Phaser.Geom.Intersects.RectangleToRectangle(aimArea, enemy.body.getBounds())
    );
    const locked = Boolean(lockedEnemy);
    const weak = this.enemies.some(
      (enemy) =>
        enemy.alive &&
        this.enemyWeakpointHit(enemy, this.reticle.x, this.reticle.y, radius)
    );
    const threat = lockedEnemy?.threat ?? "normal";
    const range = lockedEnemy?.rangeBand;
    if (locked === this.reticleLocked && weak === this.reticleWeak && threat === this.reticleThreat && range === this.reticleRange) return;
    this.reticleLocked = locked;
    this.reticleWeak = weak;
    this.reticleThreat = threat;
    this.reticleRange = range;
    const rangePower = lockedEnemy ? this.rangeDamageMultiplier(lockedEnemy) : 1;
    const color = weak
      ? 0x6fffe6
      : locked && this.phase4Mode()
        ? rangePower >= 1.1
          ? 0x72ffb3
          : rangePower < 0.65
            ? 0xff6b62
            : range
              ? RANGE_STYLE[range].color
              : 0xf7e1a0
        : locked
          ? this.threatColor(threat)
          : 0xf7e1a0;
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
    if (this.phase4Mode()) return this.createToyEnemy(point, isBoss, isElite);
    const c = this.add.container(point.x, point.y + 18).setDepth(point.kind === "street" || point.kind === "edge" ? 5 : 4);
    c.setAlpha(0);
    c.setScale(isBoss ? 1.18 : isElite ? 0.92 : 0.78);
    const shadow = this.add.ellipse(0, isBoss ? 52 : 34, isBoss ? 156 : 76, isBoss ? 32 : 18, 0x000000, 0.3);
    const enemyFrame = this.pickEnemyFrame(isBoss);
    const pattern = isBoss ? "tank" : this.enemyPattern(enemyFrame);
    const threat = this.pickEnemyThreat(pattern, isBoss, isElite);
    const threatColor = this.threatColor(threat);
    const bossFrame = this.currentTheme().bossSprite;
    const bossMeta = BOSS_SPRITES[bossFrame];
    const bossHeight = 213;
    const bossWidth = Math.round((bossMeta.w / bossMeta.h) * bossHeight);
    const sprite = isBoss
      ? this.bossSprite(0, -58, bossFrame, bossWidth, bossHeight)
      : this.enemySprite(0, -24, enemyFrame, 100, 108);
    const aura = isElite ? this.add.ellipse(0, 22, 86, 28, 0xffd24c, 0.24).setBlendMode(Phaser.BlendModes.ADD) : undefined;
    const warning = this.add
      .circle(0, isBoss ? -58 : -24, isBoss ? 62 : 40)
      .setStrokeStyle(isBoss ? 6 : 4, threatColor, 0.9)
      .setVisible(false);
    const aimGuide = this.createAimGuide(threatColor);
    const threatMarker = this.add
      .circle(0, isBoss ? -178 : -86, isBoss ? 8 : 6, threatColor, 0.92)
      .setStrokeStyle(2, 0xfff0c0, 0.85);
    const weakpoint = isBoss
      ? this.add.circle(0, -72, 22, 0x63ffe0, 0.2).setStrokeStyle(4, 0xbaffee, 1).setVisible(false).setDepth(8)
      : undefined;
    if (isElite) sprite.setTint(0xffd36e);
    c.add(aura ? [warning, shadow, aura, sprite, threatMarker] : [warning, shadow, sprite, threatMarker]);
    if (weakpoint) c.add(weakpoint);
    let glow: Phaser.Filters.Glow | undefined;
    if (isBoss || isElite) {
      c.enableFilters();
      glow = c.filters?.internal.addGlow(
        isBoss ? this.currentTheme().bossTint ?? this.currentTheme().accent : 0xffd36e,
        isBoss ? 2.8 : 1.7,
        isBoss ? 0.45 : 0.15,
        1,
        false,
        isBoss ? 7 : 4,
        isBoss ? 10 : 7
      );
      glow?.setPaddingOverride(null);
    }
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
      visual: sprite,
      body,
      glow,
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
      goldValue: isBoss ? 10 : threat === "yellow" ? 4 : isElite ? 5 : 1,
      bossPhase: 1,
      weakUntil: 0,
      weakpoint,
      weakOffsetY: -72,
      aimGuide,
      warning,
      threat,
      bounty: false,
      alive: true
    };
  }

  private createToyEnemy(point: SpawnPoint, isBoss = false, isElite = false): Enemy {
    const theme = this.currentTheme();
    const enemyTexture = theme.phase4EnemyTexture ?? "phase4Toys";
    const bossTexture = theme.phase4BossTexture ?? "phase4Boss";
    const stageBalance = PHASE4_STAGE_BALANCE[Phaser.Math.Clamp(this.wave - 1, 0, PHASE4_STAGE_BALANCE.length - 1)];
    const roleSets: ToyRole[][] = [
      ["guard", "bruiser", "sniper"],
      ["bruiser", "shield", "guard", "sniper"],
      ["shield", "sniper", "bruiser", "guard"]
    ];
    const role = isBoss
      ? "boss"
      : roleSets[this.waveAct - 1][this.actSpawned % roleSets[this.waveAct - 1].length];
    const rangeBand: RangeBand = role === "sniper" ? "far" : role === "bruiser" ? (this.actSpawned % 2 === 0 ? "mid" : "near") : "mid";
    const rangeStyle = RANGE_STYLE[rangeBand];
    const x = Phaser.Math.Clamp(point.x, 80, 880);
    const y = isBoss ? 272 : rangeStyle.y + Phaser.Math.Between(-14, 14);
    const rangeScale = isBoss ? 0.86 : rangeStyle.scale;
    const c = this.add.container(x, y).setDepth(3 + y / 100).setAlpha(0).setScale(rangeScale * 0.55);
    const frame: Record<Exclude<ToyRole, "boss">, string> = {
      bruiser: "toyBruiser",
      guard: "toyGuard",
      sniper: "toySniper",
      shield: "toyShield"
    };
    const shadow = this.add.ellipse(0, isBoss ? 70 : 48, isBoss ? 170 : 110, isBoss ? 32 : 22, 0x080817, 0.42);
    const visual = isBoss
      ? this.add.image(0, -32, bossTexture).setDisplaySize(282, 282)
      : this.add.image(0, -30, enemyTexture, frame[role as Exclude<ToyRole, "boss">]).setDisplaySize(190, 190);
    const threat = isBoss ? "red" : role === "sniper" ? "purple" : isElite ? "yellow" : role === "bruiser" ? "red" : "normal";
    const threatColor = this.threatColor(threat);
    const warning = this.add.circle(0, isBoss ? -58 : -28, isBoss ? 78 : 48).setStrokeStyle(isBoss ? 6 : 4, threatColor, 0.92).setVisible(false);
    const aimGuide = this.createAimGuide(threatColor);
    const rangeBadge = this.add.text(0, isBoss ? -196 : -108, isBoss ? "보스 / 중거리" : rangeStyle.label, {
      color: `#${(isBoss ? 0xff718f : rangeStyle.color).toString(16).padStart(6, "0")}`,
      fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
      fontSize: isBoss ? "13px" : "11px",
      fontStyle: "bold",
      stroke: "#111425",
      strokeThickness: 4
    }).setOrigin(0.5);
    const barY = isBoss ? -177 : -91;
    const barWidth = isBoss ? 156 : 98;
    const barBack = this.add.rectangle(0, barY, barWidth + 6, 11, 0x0b0d18, 0.92).setStrokeStyle(2, 0xe7e9ff, 0.5);
    const healthBar = this.add.rectangle(-barWidth / 2, barY, barWidth, 5, 0xff5e78, 1).setOrigin(0, 0.5);
    const armorBar = this.add.rectangle(-barWidth / 2, barY + 8, barWidth, 3, 0x64e9ff, 1).setOrigin(0, 0.5);
    const breakBar = this.add.rectangle(-barWidth / 2, barY + 13, barWidth, 2, 0xffd76b, 1).setOrigin(0, 0.5).setScale(0, 1);
    const statusBadge = this.add.text(0, isBoss ? 112 : barY + 25, "", {
      color: "#8ff7ff",
      fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
      fontSize: isBoss ? "12px" : "10px",
      fontStyle: "bold",
      stroke: "#101329",
      strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);
    const bossStageRamp = isBoss ? 1 + Math.max(0, this.wave - 1) * 0.18 : 1;
    const baseHp = isBoss ? 260 : role === "shield" ? 32 : role === "guard" ? 24 : role === "bruiser" ? 20 : 15;
    const hp = Math.round(baseHp * stageBalance.hp * bossStageRamp * (isElite ? 1.55 : 1));
    const baseArmor = isBoss ? 96 : role === "shield" ? 18 : role === "guard" ? 6 : isElite ? 9 : 0;
    const armor = Math.round(baseArmor * stageBalance.armor * (isBoss ? 1 + Math.max(0, this.wave - 1) * 0.12 : 1));
    const baseBreak = isBoss ? 110 : isElite ? 34 : role === "shield" ? 24 : role === "guard" ? 18 : 0;
    const maxBreak = Math.round(baseBreak * stageBalance.break * (isBoss ? 1 + Math.max(0, this.wave - 1) * 0.1 : 1));
    const weakOffsetY = isBoss ? -62 : role === "shield" ? -31 : -43;
    const weakpoint = maxBreak > 0
      ? this.add.circle(0, weakOffsetY, isBoss ? 23 : 13, 0x63ffe0, 0.18).setStrokeStyle(isBoss ? 4 : 3, 0xbaffee, 1).setVisible(false)
      : undefined;
    c.add([warning, shadow, visual, rangeBadge, barBack, healthBar, armorBar, breakBar, statusBadge]);
    if (weakpoint) c.add(weakpoint);

    armorBar.setVisible(armor > 0);
    breakBar.setVisible(maxBreak > 0);
    const pattern: EnemyPattern = isBoss ? "tank" : role === "bruiser" ? "charger" : role === "sniper" ? "shooter" : role === "shield" ? "tank" : "skirmisher";
    const body = this.add.rectangle(x, y, isBoss ? 144 : 82, isBoss ? 188 : 112, 0xffffff, 0).setDepth(4);
    let glow: Phaser.Filters.Glow | undefined;
    if (isBoss || isElite) {
      c.enableFilters();
      glow = c.filters?.internal.addGlow(isBoss ? 0x77ecff : 0xffd76b, isBoss ? 3.2 : 2, 0.3, 1, false, isBoss ? 8 : 5, isBoss ? 12 : 8);
      glow?.setPaddingOverride(null);
    }
    this.tweens.add({ targets: c, alpha: 1, scale: rangeScale, duration: 320, ease: "Back.easeOut" });
    return {
      sprite: c,
      visual,
      body,
      glow,
      hp,
      maxHp: hp,
      speed: (isBoss ? 24 : role === "bruiser" ? 58 : role === "sniper" ? 34 : 45) * stageBalance.speed,
      lane: y,
      nextShot: this.time.now + Phaser.Math.Between(isBoss ? 1200 : 1700, isBoss ? 1900 : 3000),
      nextMove: this.time.now + Phaser.Math.Between(800, 1500),
      minX: isBoss ? 260 : 68,
      maxX: isBoss ? 700 : 892,
      direction: x < 480 ? 1 : -1,
      coverY: y,
      isBoss,
      isElite,
      pattern,
      nextSpecial: this.time.now + Phaser.Math.Between(2300, 4200),
      goldValue: isBoss ? 10 : isElite ? 4 : role === "shield" ? 2 : 1,
      bossPhase: 1,
      weakUntil: 0,
      weakpoint,
      weakOffsetY,
      aimGuide,
      warning,
      threat,
      bounty: false,
      alive: true,
      rangeBand,
      rangeScale,
      role,
      armor,
      maxArmor: armor,
      breakValue: 0,
      maxBreak,
      brokenUntil: 0,
      healthBar,
      armorBar,
      breakBar,
      rangeBadge,
      statusBadge,
      moonMarkedUntil: 0,
      burnStacks: 0,
      burnUntil: 0,
      nextBurnTick: 0
    };
  }

  private pickEnemyThreat(pattern: EnemyPattern, isBoss: boolean, isElite: boolean): EnemyThreat {
    if (isBoss) return "red";
    if (isElite) return Math.random() < 0.45 ? "purple" : "yellow";
    if (pattern === "trickster") return "purple";
    if (pattern === "shooter" && Math.random() < 0.48) return "red";
    if (pattern === "skirmisher" && Math.random() < 0.48) return "yellow";
    return "normal";
  }

  private threatColor(threat: EnemyThreat) {
    if (threat === "red") return 0xff493d;
    if (threat === "yellow") return 0xffd24c;
    if (threat === "purple") return 0xc66cff;
    return 0xff8f5c;
  }

  private createAimGuide(color: number) {
    return this.add
      .rectangle(0, 0, 1, 2, color, 0.24)
      .setOrigin(0, 0.5)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
  }

  private updateEnemyAimGuide(enemy: Enemy, active: boolean, time: number) {
    const guide = enemy.aimGuide;
    if (!guide) return;
    guide.setVisible(active);
    if (!active) return;
    const startX = enemy.sprite.x;
    const startY = enemy.sprite.y - (enemy.isBoss ? 48 : 20);
    const targetX = this.player.x;
    const targetY = this.player.y - 14;
    const distance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const pulse = 0.16 + (Math.sin(time / 70) + 1) * 0.11;
    guide
      .setPosition(startX, startY)
      .setRotation(angle)
      .setDisplaySize(distance, enemy.threat === "purple" ? 2 : enemy.isBoss ? 4 : 3)
      .setAlpha(pulse);
  }

  private spawnWave() {
    this.clearCombat();
    this.isPointerDown = false;
    this.activeTouchMoves.clear();
    this.updateTouchMove();
    this.activeEvent = undefined;
    this.vignetteMood = "";
    this.createWorld();
    if (this.player) {
      this.player.setPosition(480, 442);
      this.playerBody.setPosition(480, 442);
      this.player.setDepth(this.phase4Mode() ? PHASE4_PLAYER_DEPTH : 5);
      this.playerBody.setDepth(5);
      this.reticle.setDepth(20);
      this.playerCover?.setVisible(this.phase4Mode()).setPosition(480, 477);
      this.playerCoverFront?.setVisible(this.phase4Mode()).setPosition(480, 477);
      if (this.phase4Mode()) this.setPlayerPose("cover");
    }
    this.nextEnemyShot = this.time.now + 2600;
    this.invulnerableUntil = this.time.now + 5000;
    this.lives = Math.max(this.lives, this.maxLives);
    this.stageKills = 0;
    this.bossSpawned = false;
    this.waveAct = 1;
    this.actTransitioning = false;
    this.inFieldUpgrade = false;
    this.fieldUpgradeOverlay.classList.add("hidden");
    this.fieldUpgradeOverlay.setAttribute("aria-hidden", "true");
    this.nextEliteKill = 25;
    this.actSpawned = 0;
    this.actDefeated = 0;
    this.maxCoverHp = this.coverCapacity();
    this.coverHp = this.maxCoverHp;
    this.coverBrokenUntil = 0;
    this.coverInvulnerableUntil = this.time.now + 1200;
    this.applyCoverVisualState();
    this.nextSpawn = this.time.now + 360;
    this.nextHazard = this.time.now + 12000;
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
    this.stageCoreBreaks = 0;
    this.stageDreamBursts = 0;
    this.stageReport = undefined;
    this.runCompletePending = false;
    this.reloading = false;
    this.ammo = this.magazineSize();
    this.enterCover();
    this.beginAct(1, false);
  }

  private spawnEnemy(forceElite = false, bounty = false) {
    const point = this.pickOpenSpawnPoint();
    if (!point) return;
    const phase4Elite = this.phase4Mode() && this.waveAct >= 2 && this.actSpawned === this.phase4Quota() - 1;
    const isElite = forceElite || phase4Elite || (!this.phase4Mode() && !this.bossSpawned && this.stageKills >= this.nextEliteKill);
    if (isElite && !forceElite) this.nextEliteKill += 25;
    const enemy = this.createEnemy(point, false, isElite);
    enemy.bounty = bounty;
    this.enemies.push(enemy);
    if (this.phase4Mode()) this.actSpawned += 1;
    if (isElite) this.updateHud("정예 적 출현!");
  }

  private pickOpenSpawnPoint() {
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    if (this.phase4Mode()) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const x = Phaser.Math.Between(92, 868);
        const y = RANGE_STYLE.mid.y;
        if (this.positionHasRoom(x, y, undefined, 150, 76)) return { x, y, minX: 68, maxX: 892, kind: "street" as const };
      }
      return undefined;
    }
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
    const point: SpawnPoint = { x: 480, y: this.phase4Mode() ? 272 : 286, minX: 300, maxX: 680, kind: "street" };
    const boss = this.createEnemy(point, true);
    boss.nextShot = this.time.now + 2300;
    boss.nextSpecial = this.time.now + 3200;
    this.enemies.push(boss);
    this.playBossIntro(boss);
    this.updateHud();
  }

  private playBossIntro(boss: Enemy) {
    this.statusTimer?.remove(false);
    this.statusText.classList.remove("show", "stage", "act", "boss", "minor");
    this.punchCameraFilter(8, 0.84, 420);
    this.cameras.main.shake(520, 0.012);
    const plate = this.add.rectangle(480, 270, 960, 94, 0x090604, 0.94).setDepth(24).setScale(0, 1);
    const ruleTop = this.add.rectangle(480, 220, 960, 3, this.currentTheme().bossTint ?? this.currentTheme().trim, 0.95).setDepth(25).setScale(0, 1);
    const ruleBottom = this.add.rectangle(480, 320, 960, 3, this.currentTheme().bossTint ?? this.currentTheme().trim, 0.95).setDepth(25).setScale(0, 1);
    const wanted = this.add.text(480, 245, this.phase4Mode() ? "악몽 신호 감지" : "현상 수배 - 생사 불문", {
      color: "#d5a650",
      fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
      fontSize: "15px",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(26).setAlpha(0);
    const name = this.add.text(480, 282, this.currentTheme().bossName ?? "무법자", {
      color: "#fff0bd",
      fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#3a1710",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(26).setAlpha(0);
    this.tweens.add({ targets: [plate, ruleTop, ruleBottom], scaleX: 1, duration: 260, ease: "Cubic.easeOut" });
    this.tweens.add({ targets: [wanted, name], alpha: 1, duration: 180, delay: 150 });
    this.time.delayedCall(1250, () => {
      this.tweens.add({
        targets: [plate, ruleTop, ruleBottom, wanted, name],
        alpha: 0,
        duration: 260,
        onComplete: () => {
          plate.destroy();
          ruleTop.destroy();
          ruleBottom.destroy();
          wanted.destroy();
          name.destroy();
        }
      });
    });
    if (boss.glow) this.tweens.add({ targets: boss.glow, outerStrength: 6.5, yoyo: true, duration: 540 });
  }

  private handleInput(delta: number) {
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchMove.x < 0;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchMove.x > 0;
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.touchMove.y < 0;
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.touchMove.y > 0;
    const speed = 305 * (1 + this.fieldUpgrades.quickstep * 0.12) * (delta / 1000);
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
    this.coverIndicator.setPosition(x, y - 64);
    this.playerCover?.setPosition(x, y + 35);
    this.playerCoverFront?.setPosition(x, y + 35);
    this.player.setScale(this.reticle.x >= this.player.x ? 1 : -1, 1);
  }

  private magazineSize() {
    const lunarBonus = this.dreamSetState().lunar ? 2 : 0;
    return 6 + this.fieldUpgrades.longCylinder * 2 + this.dreamParts.starCylinder * 2 + lunarBonus;
  }

  private reloadDuration() {
    const shopSpeed = Math.max(0.58, 1 - this.gunReloadLevel * 0.07);
    const fieldSpeed = Math.pow(0.86, this.fieldUpgrades.speedLoader);
    const dreamSpeed = Math.pow(0.88, this.dreamParts.dreamGrip);
    const setSpeed = this.dreamSetState().comet ? 0.84 : 1;
    return Math.round(1080 * shopSpeed * fieldSpeed * dreamSpeed * setSpeed);
  }

  private enterCover() {
    if (!this.gameStarted || this.inShop || this.inFieldUpgrade || this.isGameOver) return;
    if (this.phase4Mode() && this.coverBrokenUntil > this.time.now) {
      this.covering = false;
      this.tweens.killTweensOf(this.playerSprite);
      this.setPlayerPose(this.reloading ? "reload" : "aim");
      this.tweens.add({
        targets: this.playerSprite,
        y: this.reloading ? -18 : PHASE4_PLAYER_AIM_Y,
        duration: 110,
        ease: "Quad.easeOut"
      });
      return;
    }
    this.covering = true;
    this.coverReadyAt = this.time.now + 130;
    this.tweens.killTweensOf(this.playerSprite);
    if (this.phase4Mode()) {
      this.setPlayerPose(this.reloading ? "reload" : "cover");
      this.tweens.add({ targets: this.playerSprite, y: this.reloading ? -22 : 5, duration: 150, ease: "Quad.easeOut" });
      this.coverIndicator.setVisible(false);
    } else {
      this.tweens.add({ targets: this.playerSprite, y: -7, duration: 130, ease: "Quad.easeOut" });
      this.coverIndicator.setText(this.reloading ? "재장전" : "엄폐").setColor(this.reloading ? "#ffd36e" : "#9af2ff").setVisible(true);
    }
  }

  private leaveCover() {
    if (this.reloading || this.isGameOver || this.inShop || this.inFieldUpgrade) return;
    this.covering = false;
    this.tweens.killTweensOf(this.playerSprite);
    if (this.phase4Mode()) {
      this.setPlayerPose("aim");
      this.tweens.add({ targets: this.playerSprite, y: PHASE4_PLAYER_AIM_Y, duration: 105, ease: "Back.easeOut" });
    } else {
      this.tweens.add({ targets: this.playerSprite, y: -20, duration: 90, ease: "Quad.easeOut" });
    }
    this.coverIndicator.setVisible(false);
  }

  private startReload() {
    if (this.reloading || this.ammo >= this.magazineSize() || this.inShop || this.inFieldUpgrade || this.isGameOver) return;
    this.reloading = true;
    this.reloadUntil = this.time.now + this.reloadDuration();
    if (this.phase4Mode() && this.coverBrokenUntil <= this.time.now) {
      this.coverHp = Math.min(this.maxCoverHp, this.coverHp + 3 + this.dreamParts.dreamGrip * 4);
      this.applyCoverVisualState();
    }
    this.enterCover();
    if (this.phase4Mode()) this.setPlayerPose("reload");
    this.updateHud(this.ammo === 0 ? "탄약 없음 - 재장전" : undefined);
  }

  private updateReloadState(time: number) {
    if (!this.reloading || time < this.reloadUntil) return;
    this.reloading = false;
    this.ammo = this.magazineSize();
    if (this.isPointerDown) this.leaveCover();
    else this.enterCover();
    this.updateHud();
  }

  private shoot() {
    if (this.isGameOver || this.inShop || this.inFieldUpgrade || this.reloading || this.time.now < this.nextPlayerShot) return;
    if (this.ammo <= 0) {
      this.startReload();
      return;
    }
    const weapon = this.weaponStats();
    this.leaveCover();
    if (this.phase4Mode()) {
      this.setPlayerPose("fire");
      this.time.delayedCall(Math.min(110, weapon.delay * 0.55), () => {
        if (!this.covering && !this.reloading && this.playerPose === "fire") this.setPlayerPose("aim");
      });
    }
    this.nextPlayerShot = this.time.now + weapon.delay;
    this.lastShotAt = this.time.now;
    this.ammo -= 1;
    this.shotsFired += 1;
    const start = new Phaser.Math.Vector2(this.player.x, this.player.y - 18);
    const target = new Phaser.Math.Vector2(this.reticle.x, this.reticle.y);
    const direction = target.subtract(start).normalize();
    this.cameras.main.shake(weapon.shake, 0.0025);
    this.flash(start.x + direction.x * 34, start.y + direction.y * 34, 0xfff0a8);
    this.impactAt(this.reticle.x, this.reticle.y);
    const critical = weapon.critChance > 0 && Math.random() < weapon.critChance;
    const damage = critical ? weapon.damage * 2 : weapon.damage;
    const intercepted = this.interceptBulletAt(this.reticle.x, this.reticle.y, weapon.radius);
    let hit = intercepted;
    if (!intercepted) {
      const enemiesHitThisShot = new Set<Enemy>();
      hit = this.hitScanAt(this.reticle.x, this.reticle.y, damage, weapon.radius, weapon.pierce, enemiesHitThisShot);
      for (let index = 0; index < weapon.extraHits; index += 1) {
        const side = index % 2 === 0 ? -1 : 1;
        const lane = Math.floor(index / 2) + 1;
        hit = this.hitScanAt(
          this.reticle.x + side * weapon.radius * 0.72 * lane,
          this.reticle.y,
          damage,
          weapon.radius,
          weapon.pierce,
          enemiesHitThisShot
        ) || hit;
      }
    }
    if (hit) this.shotsHit += 1;
    if (critical && hit) this.pop(this.reticle.x, this.reticle.y, "치명타!");
    if (this.ammo <= 0) this.time.delayedCall(90, () => this.startReload());
    this.updateHud();
  }

  private spawnBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    fromPlayer: boolean,
    piercesCover = false,
    color = 0xff6959,
    kind: EnemyProjectileKind = "star"
  ) {
    const frames: Record<EnemyProjectileKind, string> = {
      star: "projectileStar",
      orb: "projectileOrb",
      comet: "projectileComet",
      nightmare: "projectileNightmare"
    };
    const displaySizes: Record<EnemyProjectileKind, number> = { star: 58, orb: 72, comet: 68, nightmare: 84 };
    const radii: Record<EnemyProjectileKind, number> = { star: 7, orb: 12, comet: 7, nightmare: 15 };
    const damageByKind: Record<EnemyProjectileKind, number> = { star: 3, orb: 5, comet: 4, nightmare: 8 };
    const sprite = this.add.container(x, y).setDepth(10);
    let visual: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
    if (this.textures.exists("phase4Projectiles")) {
      visual = this.add.image(0, 0, "phase4Projectiles", frames[kind]).setDisplaySize(displaySizes[kind], displaySizes[kind]);
    } else {
      visual = this.add.circle(0, 0, radii[kind], fromPlayer ? 0xfff2a8 : color, 1);
    }
    visual.setBlendMode(Phaser.BlendModes.ADD);
    sprite.add(visual);
    sprite.setRotation(Math.atan2(vy, vx));
    const speed = Math.max(1, Math.hypot(vx, vy));
    const travelDistance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y - 14);
    const initialLife = Phaser.Math.Clamp((travelDistance / speed) * 1000 + 620, 1300, 2900);
    const startScale = Phaser.Math.Clamp(0.5 + (y / 540) * 0.24, 0.54, 0.72);
    const endScale = kind === "nightmare" ? 1.16 : kind === "orb" ? 1.08 : 1;
    sprite.setScale(startScale);
    if (this.game.renderer.type === Phaser.WEBGL) {
      sprite.enableFilters();
      const glow = sprite.filters?.internal.addGlow(color, kind === "nightmare" ? 3.2 : kind === "orb" ? 2.7 : 2, 0.28, 1, false, 3, 6);
      glow?.setPaddingOverride(null);
    }
    this.bullets.push({
      sprite,
      visual,
      vx,
      vy,
      fromPlayer,
      piercesCover,
      life: initialLife,
      initialLife,
      radius: radii[kind],
      kind,
      startScale,
      endScale,
      trailCooldown: 0,
      damage: piercesCover ? Math.max(7, damageByKind[kind]) : damageByKind[kind]
    });
  }

  private updateEnemies(time: number, delta: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.updateEnemyDreamStatus(enemy, time);
      if (!enemy.alive) continue;
      const broken = (enemy.brokenUntil ?? 0) > time;
      if (!broken) this.moveEnemy(enemy, time, delta);
      this.separateEnemy(enemy);
      enemy.body.setPosition(enemy.sprite.x, enemy.sprite.y);
      if (this.phase4Mode()) {
        enemy.visual?.setFlipX(enemy.sprite.x >= this.player.x);
        enemy.sprite.setDepth(3 + enemy.sprite.y / 100);
        const scale = enemy.rangeScale ?? 1;
        enemy.body.setSize((enemy.isBoss ? 144 : 82) * scale, (enemy.isBoss ? 188 : 112) * scale);
        const rangeLabel = broken ? "붕괴!" : enemy.isBoss ? "보스 / 중거리" : RANGE_STYLE[enemy.rangeBand ?? "mid"].label;
        if (enemy.rangeBadge && enemy.rangeBadge.text !== rangeLabel) {
          enemy.rangeBadge.setText(rangeLabel).setColor(
            broken ? "#ffd76b" : `#${(enemy.isBoss ? 0xff718f : RANGE_STYLE[enemy.rangeBand ?? "mid"].color).toString(16).padStart(6, "0")}`
          );
        }
        enemy.rangeBadge?.setAlpha(broken ? 1 : 0.9);
      } else {
        enemy.sprite.setScale(enemy.sprite.x < this.player.x ? 1 : -1, 1);
      }
      if (enemy.isBoss) this.updateBossPattern(enemy, time);
      if (enemy.glow) {
        const base = enemy.isBoss ? 2.6 : 1.5;
        const weakBoost = enemy.isBoss && time < enemy.weakUntil ? 2.8 : 0;
        enemy.glow.outerStrength = base + weakBoost + (Math.sin((time + enemy.lane * 5) / 170) + 1) * 0.35;
      }

      const warningLead = enemy.threat === "red" ? 900 : enemy.threat === "purple" ? 760 : 580;
      const warningActive = !broken && this.enemyCanShoot(enemy) && time >= enemy.nextShot - warningLead;
      enemy.warning.setVisible(warningActive);
      if (warningActive) {
        enemy.warning.setAlpha(0.42 + (Math.sin(time / 85) + 1) * 0.2);
        enemy.warning.setScale(0.92 + (Math.sin(time / 110) + 1) * 0.1);
      }
      const weakVisible = Boolean(
        enemy.weakpoint &&
        (broken || time < enemy.weakUntil || (warningActive && (enemy.maxBreak ?? 0) > 0))
      );
      enemy.weakpoint
        ?.setVisible(weakVisible)
        .setAlpha(broken ? 1 : 0.72 + (Math.sin(time / 80) + 1) * 0.12);
      this.updateEnemyAimGuide(enemy, warningActive, time);

      if (
        time > enemy.nextShot &&
        time > this.nextEnemyShot &&
        this.enemyCanShoot(enemy) &&
        Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y) < 640
      ) {
        const start = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y - 18);
        const eventSpread = this.activeEvent?.kind === "darkness" ? 18 : 0;
        const spreadBase = enemy.threat === "red" ? 8 : enemy.threat === "purple" ? 14 : enemy.isElite ? 18 : 34;
        const spread = (enemy.isBoss ? 10 : spreadBase) + eventSpread;
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
        const threatSpeed = enemy.threat === "red" ? 46 : enemy.threat === "purple" ? -8 : enemy.threat === "yellow" ? 22 : 0;
        const bulletSpeed = (enemy.isBoss ? 260 + this.wave * 5 : enemy.isElite ? 245 + this.wave * 4 : 210 + this.wave * 4) + threatSpeed;
        const piercesCover = enemy.threat === "purple" && enemy.isElite;
        this.spawnBullet(
          start.x,
          start.y,
          direction.x * bulletSpeed,
          direction.y * bulletSpeed,
          false,
          piercesCover,
          this.threatColor(enemy.threat),
          this.projectileKind(enemy)
        );
        this.flash(start.x + direction.x * 24, start.y + direction.y * 24, enemy.isBoss ? 0xffd24c : 0xff6048);
        enemy.nextShot = time + this.enemyShotDelay(enemy);
        enemy.warning.setVisible(false);
        enemy.aimGuide?.setVisible(false);
        this.nextEnemyShot = time + (enemy.isBoss ? 520 : enemy.isElite ? 680 : 860);
      }
    }
  }

  private updateBossPattern(enemy: Enemy, time: number) {
    if (time <= enemy.nextSpecial) return;
    enemy.nextSpecial = time + (enemy.bossPhase === 2 ? 3000 : 4200);
    const warning = this.add.circle(enemy.sprite.x, enemy.sprite.y - 42, 32).setStrokeStyle(5, 0xff4438, 0.95).setDepth(13);
    this.tweens.add({ targets: warning, scale: 2.1, alpha: 0.15, duration: 520, ease: "Quad.easeIn" });
    this.showStatus("악몽 포격 예고 - 탄환을 요격하세요", "boss", 900);
    this.time.delayedCall(520, () => {
      warning.destroy();
      if (!enemy.alive) return;
      enemy.weakUntil = this.time.now + (enemy.bossPhase === 2 ? 1350 : 1750);
      enemy.weakpoint?.setVisible(true);
      this.pop(enemy.sprite.x, enemy.sprite.y - 90, "약점 노출!");
      const shots = enemy.bossPhase === 2 ? 5 : 3;
      for (let index = 0; index < shots; index += 1) {
        this.time.delayedCall(index * 95, () => {
          if (!enemy.alive || this.inShop || this.isGameOver) return;
          const start = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y - 28);
          const offset = (index - (shots - 1) / 2) * 62;
          const target = new Phaser.Math.Vector2(this.player.x + offset, this.player.y - 12);
          const direction = target.subtract(start).normalize();
          const speed = 235 + this.wave * 5 + enemy.bossPhase * 20;
          this.spawnBullet(start.x, start.y, direction.x * speed, direction.y * speed, false, true, 0xc66cff, "nightmare");
          this.flash(start.x, start.y, 0xdd7bff);
        });
      }
      this.time.delayedCall(enemy.bossPhase === 2 ? 1350 : 1750, () => {
        if (enemy.alive && this.time.now >= enemy.weakUntil) enemy.weakpoint?.setVisible(false);
      });
    });
  }

  private moveEnemy(enemy: Enemy, time: number, delta: number) {
    if (this.phase4Mode()) {
      this.moveToyEnemy(enemy, time, delta);
      return;
    }
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

  private moveToyEnemy(enemy: Enemy, time: number, delta: number) {
    if (enemy.isBoss) {
      if (time > enemy.nextMove) {
        enemy.direction = Math.random() > 0.5 ? 1 : -1;
        enemy.nextMove = time + Phaser.Math.Between(1100, 1900);
      }
    } else if (enemy.role === "bruiser" && time > enemy.nextSpecial && enemy.rangeBand !== "near") {
      this.setEnemyRange(enemy, enemy.rangeBand === "far" ? "mid" : "near");
      enemy.nextSpecial = time + 3600;
      this.pop(enemy.sprite.x, enemy.sprite.y - 48, "접근 중");
    } else if (enemy.role === "bruiser" && enemy.rangeBand === "near" && time > enemy.nextSpecial) {
      enemy.direction = enemy.sprite.x < this.player.x ? 1 : -1;
      if (this.toyMeleeInRange(enemy, 34)) {
        enemy.nextSpecial = time + 3200;
        const attackDirection = enemy.direction;
        const tell = this.add.circle(enemy.sprite.x, enemy.sprite.y - 30, 42).setStrokeStyle(5, 0xff6b62, 0.95).setDepth(13);
        this.tweens.add({ targets: tell, scale: 1.65, alpha: 0.18, duration: 520, ease: "Quad.easeIn" });
        this.tweens.add({
          targets: enemy.sprite,
          x: enemy.sprite.x + attackDirection * 28,
          duration: 480,
          ease: "Cubic.easeIn"
        });
        this.time.delayedCall(520, () => {
          tell.destroy();
          if (!enemy.alive || this.inShop || this.isGameOver) return;
          if (!this.toyMeleeInRange(enemy)) {
            this.pop(enemy.sprite.x, enemy.sprite.y - 52, "회피!");
            return;
          }
          if (this.covering && this.coverBrokenUntil <= this.time.now && this.coverHp > 0) this.damageCover(enemy.isElite ? 12 : 9);
          else if (this.time.now > this.invulnerableUntil) this.damagePlayer();
          this.cameras.main.shake(150, 0.006);
        });
      }
    } else if (time > enemy.nextMove) {
      enemy.direction = Math.random() > 0.5 ? 1 : -1;
      enemy.nextMove = time + Phaser.Math.Between(enemy.role === "sniper" ? 1500 : 750, enemy.role === "sniper" ? 2600 : 1550);
    }
    const speedScale = enemy.rangeBand === "far" ? 0.75 : enemy.rangeBand === "near" ? 1.12 : 1;
    const nearBruiser = enemy.role === "bruiser" && enemy.rangeBand === "near";
    const horizontalDistance = Math.abs(enemy.sprite.x - this.player.x);
    const moveDirection = nearBruiser ? (enemy.sprite.x < this.player.x ? 1 : -1) : enemy.direction;
    const canAdvance = !nearBruiser || horizontalDistance > this.toyMeleeReach(enemy) * 0.72;
    if (canAdvance) enemy.sprite.x += moveDirection * enemy.speed * speedScale * (delta / 1000);
    if (enemy.sprite.x <= enemy.minX || enemy.sprite.x >= enemy.maxX) enemy.direction *= -1;
    enemy.sprite.x = Phaser.Math.Clamp(enemy.sprite.x, enemy.minX, enemy.maxX);
    const bob = enemy.role === "bruiser" ? 5 : enemy.role === "sniper" ? 2 : 3;
    enemy.sprite.y = enemy.coverY + Math.sin((time + enemy.lane * 7) / 330) * bob;
  }

  private toyMeleeReach(enemy: Enemy) {
    const scale = enemy.rangeScale ?? 1;
    return (enemy.isElite ? 138 : 118) * scale;
  }

  private toyMeleeInRange(enemy: Enemy, anticipation = 0) {
    if (enemy.role !== "bruiser" || enemy.rangeBand !== "near") return false;
    const horizontalDistance = Math.abs(enemy.sprite.x - this.player.x);
    const verticalDistance = Math.abs(enemy.sprite.y + 34 - this.player.y);
    return horizontalDistance <= this.toyMeleeReach(enemy) + anticipation && verticalDistance <= 108;
  }

  private setEnemyRange(enemy: Enemy, band: RangeBand) {
    const style = RANGE_STYLE[band];
    enemy.rangeBand = band;
    enemy.rangeScale = style.scale;
    enemy.coverY = style.y + Phaser.Math.Between(-10, 10);
    enemy.rangeBadge?.setText(style.label).setColor(`#${style.color.toString(16).padStart(6, "0")}`);
    this.tweens.add({
      targets: enemy.sprite,
      y: enemy.coverY,
      scale: style.scale,
      duration: 520,
      ease: "Cubic.easeInOut"
    });
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
    if (this.phase4Mode()) return enemy.isBoss || enemy.role !== "bruiser";
    return enemy.isBoss || enemy.pattern === "shooter" || enemy.pattern === "skirmisher" || enemy.pattern === "trickster";
  }

  private projectileKind(enemy: Enemy): EnemyProjectileKind {
    if (enemy.isBoss) return "nightmare";
    if (enemy.role === "sniper" || enemy.pattern === "shooter") return "comet";
    if (enemy.role === "shield" || enemy.pattern === "tank" || enemy.threat === "purple") return "orb";
    return "star";
  }

  private enemyShotDelay(enemy: Enemy) {
    const base = enemy.isBoss
      ? Phaser.Math.Between(1250, 2100)
      : enemy.isElite
        ? Phaser.Math.Between(1900, 3000)
        : enemy.pattern === "shooter"
          ? Phaser.Math.Between(2300, 3600)
          : enemy.pattern === "skirmisher"
            ? Phaser.Math.Between(2700, 4100)
            : Phaser.Math.Between(3000, 4500);
    const threatFactor = enemy.threat === "red" ? 0.72 : enemy.threat === "purple" ? 0.88 : 1;
    const stageFactor = this.phase4Mode()
      ? PHASE4_STAGE_BALANCE[Phaser.Math.Clamp(this.wave - 1, 0, PHASE4_STAGE_BALANCE.length - 1)].fireDelay
      : 1;
    return Math.round(base * threatFactor * stageFactor);
  }

  private updateBullets(delta: number) {
    for (const bullet of [...this.bullets]) {
      bullet.sprite.x += bullet.vx * (delta / 1000);
      bullet.sprite.y += bullet.vy * (delta / 1000);
      bullet.life -= delta;
      const progress = Phaser.Math.Clamp(1 - bullet.life / bullet.initialLife, 0, 1);
      const perspective = Phaser.Math.Linear(bullet.startScale, bullet.endScale, Phaser.Math.Easing.Cubic.Out(progress));
      const pulse = bullet.kind === "orb" || bullet.kind === "nightmare" ? 1 + Math.sin(this.time.now / 72) * 0.055 : 1;
      bullet.sprite.setScale(perspective * pulse).setDepth(9 + progress * 5);
      bullet.trailCooldown -= delta;
      if (!bullet.fromPlayer && bullet.trailCooldown <= 0) {
        bullet.trailCooldown = bullet.kind === "comet" ? 38 : 58;
        this.spawnBulletTrail(bullet);
      }
      if (bullet.fromPlayer) {
        if (this.hitEnemies(bullet)) continue;
        this.hitProps(bullet);
      } else {
        if (this.hitProps(bullet)) continue;
        if (this.bulletHitsRect(bullet, this.playerBody)) {
          const dreamCoverActive = this.hasActiveDreamCover();
          const legacyCoverActive =
            !this.phase4Mode() &&
            this.covering &&
            this.coverHp > 0 &&
            this.time.now >= this.coverBrokenUntil &&
            !bullet.piercesCover;
          this.projectileImpact(bullet.sprite.x, bullet.sprite.y, bullet.kind, dreamCoverActive || legacyCoverActive);
          this.destroyBullet(bullet);
          if (this.time.now <= this.invulnerableUntil) continue;
          if (dreamCoverActive || legacyCoverActive) {
            if (this.phase4Mode()) {
              const baseDamage = bullet.damage ?? 5;
              this.damageCover(bullet.piercesCover ? Math.ceil(baseDamage * 1.6) : baseDamage);
            }
            else {
              this.flash(this.player.x, this.player.y - 10, 0xffd37a);
              this.pop(this.player.x, this.player.y - 26, "방어");
            }
            continue;
          }
          this.damagePlayer();
        }
      }
      if (bullet.life <= 0 || bullet.sprite.x < -24 || bullet.sprite.x > 984 || bullet.sprite.y < -24 || bullet.sprite.y > 564) this.destroyBullet(bullet);
    }
  }

  private hitEnemies(bullet: Bullet) {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !this.bulletHitsRect(bullet, enemy.body)) continue;
      this.destroyBullet(bullet);
      this.damageEnemy(enemy, 1);
      return true;
    }
    return false;
  }

  private hitProps(bullet: Bullet) {
    for (const prop of [...this.props]) {
      if (!this.bulletHitsRect(bullet, prop.body)) continue;
      if (!bullet.fromPlayer) this.projectileImpact(bullet.sprite.x, bullet.sprite.y, bullet.kind, true);
      this.destroyBullet(bullet);
      this.damageProp(prop);
      return true;
    }
    return false;
  }

  private hitScanAt(x: number, y: number, damage: number, radius: number, pierce = 0, enemiesHitThisShot?: Set<Enemy>) {
    const shotLine = new Phaser.Geom.Line(this.player.x, this.player.y - 18, x, y);
    const blocker = this.firstPropOnLine(shotLine);
    if (blocker) {
      this.damageProp(blocker);
      return false;
    }

    const hitArea = new Phaser.Geom.Rectangle(x - radius, y - radius, radius * 2, radius * 2);

    const targets = this.enemies
      .filter((enemy) => {
        if (!enemy.alive || enemiesHitThisShot?.has(enemy)) return false;
        const bodyHit = Phaser.Geom.Intersects.RectangleToRectangle(hitArea, enemy.body.getBounds());
        const weakHit = this.enemyWeakpointHit(enemy, x, y, radius);
        return bodyHit || weakHit;
      })
      .sort((a, b) => Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(x, y, b.sprite.x, b.sprite.y));
    if (targets.length > 0) {
      for (const enemy of targets.slice(0, pierce + 1)) {
        const weakHit = this.enemyWeakpointHit(enemy, x, y, radius);
        this.damageEnemy(enemy, damage * this.rangeDamageMultiplier(enemy), weakHit, "shot");
        enemiesHitThisShot?.add(enemy);
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

  private enemyWeakpointHit(enemy: Enemy, x: number, y: number, radius: number) {
    if (!enemy.weakpoint?.visible) return false;
    const weakY = enemy.sprite.y + (enemy.weakOffsetY ?? -72) * Math.abs(enemy.sprite.scaleY || 1);
    const weakRadius = enemy.isBoss ? 28 : 17;
    return Phaser.Math.Distance.Between(x, y, enemy.sprite.x, weakY) <= radius + weakRadius;
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
      this.updateHud("파괴!");
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, weakHit = false, source: DamageSource = "shot") {
    if (!enemy.alive) return;
    const weakMultiplier = (this.activeBrother === "blue" ? 2.5 : 2) + this.fieldUpgrades.deadeyeGlass * 0.5;
    let resolvedDamage = weakHit ? Math.ceil(damage * weakMultiplier) : damage;
    let dreamBurst = false;
    if (this.phase4Mode()) {
      if (weakHit) resolvedDamage = Math.ceil(resolvedDamage * 1.2);
      if (source === "shot") {
        if (this.activeBrother === "blue" && weakHit) {
          enemy.moonMarkedUntil = this.time.now + 8000 + this.dreamParts.moonChoke * 500;
          this.pop(enemy.sprite.x, enemy.sprite.y - 102, "달빛 표식");
        } else if (this.activeBrother === "red") {
          dreamBurst = (enemy.moonMarkedUntil ?? 0) > this.time.now;
          if (dreamBurst) {
            enemy.moonMarkedUntil = 0;
            resolvedDamage += 4 + this.dreamParts.moonChoke + this.dreamParts.cometHammer;
          }
          enemy.burnStacks = Math.min(3, (enemy.burnStacks ?? 0) + (weakHit ? 2 : 1));
          enemy.burnUntil = this.time.now + 3200 + this.dreamParts.cometHammer * 300;
          enemy.nextBurnTick = Math.min(enemy.nextBurnTick || this.time.now + 420, this.time.now + 420);
        }
        this.updateEnemyStatusBadge(enemy);
      }
      if ((enemy.brokenUntil ?? 0) > this.time.now) resolvedDamage *= enemy.isBoss ? 1.4 : 1.65;
      if ((enemy.maxBreak ?? 0) > 0 && source === "shot" && (enemy.brokenUntil ?? 0) <= this.time.now) {
        const weakBreakBoost = weakHit ? 1.85 : 1;
        const lunarBreakBoost = this.dreamSetState().lunar ? 1.25 : 1;
        enemy.breakValue = (enemy.breakValue ?? 0) + resolvedDamage * weakBreakBoost * lunarBreakBoost * (1 + this.dreamParts.starCylinder * 0.18);
        if ((enemy.breakValue ?? 0) >= (enemy.maxBreak ?? 0)) {
          enemy.breakValue = 0;
          enemy.brokenUntil = this.time.now + (enemy.isBoss ? 2200 : 2300);
          enemy.nextShot = enemy.brokenUntil + 700;
          enemy.armor = Math.max(0, (enemy.armor ?? 0) - (enemy.maxArmor ?? 0) * 0.35);
          enemy.weakpoint?.setVisible(true);
          const breakReward = enemy.isBoss ? 2 : 1;
          this.stageCoreBreaks += 1;
          this.gold += breakReward;
          this.ammo = Math.min(this.magazineSize(), this.ammo + 1);
          this.coverHp = Math.min(this.maxCoverHp, this.coverHp + (enemy.isBoss ? 10 : 4));
          this.applyCoverVisualState();
          this.pop(enemy.sprite.x, enemy.sprite.y - 112, `핵 붕괴 +${breakReward}꿈가루`);
          this.showStatus(enemy.isBoss ? "핵 붕괴 - 총공격!" : "장난감 붕괴!", "boss", 1100);
          this.punchCameraFilter(enemy.isBoss ? 5 : 2, enemy.isBoss ? 0.9 : 0.97, 360);
        }
      }
      if ((enemy.armor ?? 0) > 0) {
        const absorbed = Math.min(enemy.armor ?? 0, resolvedDamage);
        enemy.armor = Math.max(0, (enemy.armor ?? 0) - absorbed);
        resolvedDamage -= absorbed;
        this.pop(enemy.sprite.x, enemy.sprite.y - 58, enemy.armor > 0 ? `장갑 -${Math.ceil(absorbed)}` : "장갑 파괴");
      }
      this.updateEnemyBars(enemy);
      if (resolvedDamage <= 0) {
        this.flash(enemy.sprite.x, enemy.sprite.y - 20, 0x64e9ff);
        this.updateHud();
        return;
      }
    }
    enemy.hp -= resolvedDamage;
    if (dreamBurst) this.triggerDreamBurst(enemy);
    this.updateEnemyBars(enemy);
    this.flash(enemy.sprite.x, enemy.sprite.y - 20, 0xfff0a8);
    this.tintContainer(enemy.sprite, 0xffe0a0);
    this.time.delayedCall(70, () => this.clearContainerTint(enemy.sprite));
    if (weakHit && enemy.glow) {
      enemy.glow.color = 0x79fff0;
      enemy.glow.outerStrength = 7;
      this.time.delayedCall(120, () => {
        if (enemy.alive && enemy.glow) {
          enemy.glow.color = enemy.bossPhase === 2
            ? this.currentTheme().accent
            : this.currentTheme().bossTint ?? this.currentTheme().accent;
        }
      });
    }
    if (enemy.hp > 0) {
      if (enemy.isBoss && enemy.bossPhase === 1 && enemy.hp <= enemy.maxHp / 2) this.enterBossPhaseTwo(enemy);
      if (enemy.isBoss || this.phase4Mode()) {
        const hpLabel = Math.max(0, Math.ceil(enemy.hp));
        this.pop(enemy.sprite.x, enemy.sprite.y - 82, weakHit ? `약점 -${Math.ceil(resolvedDamage)}` : `체력 ${hpLabel}`);
      }
      this.updateHud();
      return;
    }

    enemy.alive = false;
    this.combo += 1;
    if ([10, 25, 50].includes(this.combo)) {
      this.showStatus(`${this.combo}연속 처치`, "act", 1100);
      this.punchCameraFilter(this.combo === 50 ? 5 : 3, this.combo === 50 ? 0.91 : 0.96, 320);
      this.cameras.main.flash(90, 218, 164, 62);
    }
    this.stageMaxCombo = Math.max(this.stageMaxCombo, this.combo);
    this.score += enemy.isBoss ? 1000 + this.wave * 250 : 80 * this.combo;
    const goldRush = this.activeEvent?.kind === "goldRush" && this.time.now < this.activeEvent.endsAt;
    const bountyBonus = enemy.bounty && this.activeEvent?.kind === "wanted" ? 10 : 0;
    const fuseBonus = source === "dynamite" && this.gunDamageLevel >= 3 ? 1 : 0;
    const earnedGold = enemy.goldValue * (goldRush ? 2 : 1) + bountyBonus + fuseBonus + this.fieldUpgrades.bountyRounds;
    this.gold += earnedGold;
    if (!enemy.isBoss) {
      this.stageKills += 1;
      if (this.phase4Mode()) this.actDefeated += 1;
      if (enemy.isElite) this.stageEliteKills += 1;
      this.tagMeter = Phaser.Math.Clamp(this.tagMeter + (enemy.isElite ? 22 : 9), 0, 100);
    }
    const currency = this.phase4Mode() ? "꿈가루" : "골드";
    this.pop(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? `+${earnedGold}${currency} 보스` : enemy.isElite ? `+${earnedGold}${currency} 정예` : `+${earnedGold}${currency}`);
    this.explode(enemy.sprite.x, enemy.sprite.y);
    enemy.body.destroy();
    enemy.aimGuide?.destroy();
    this.cameras.main.shake(enemy.isBoss ? 280 : 70, enemy.isBoss ? 0.008 : 0.0015);
    if (enemy.isBoss || enemy.isElite) this.punchCameraFilter(enemy.isBoss ? 10 : 2.5, enemy.isBoss ? 0.8 : 0.96, enemy.isBoss ? 820 : 260);
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

    if (enemy.isBoss) this.time.delayedCall(720, () => this.finishStage());
    else if (
      this.phase4Mode() &&
      this.actDefeated >= this.phase4Quota() &&
      !this.enemies.some((other) => other.alive)
    ) {
      this.time.delayedCall(360, () => this.completeAct());
    }
  }

  private triggerDreamBurst(enemy: Enemy) {
    this.stageDreamBursts += 1;
    this.tagMeter = Phaser.Math.Clamp(this.tagMeter + 16, 0, 100);
    this.coverHp = Math.min(this.maxCoverHp, this.coverHp + 5);
    this.applyCoverVisualState();
    this.dreamBurstEffect(enemy.sprite.x, enemy.sprite.y - 22);
    this.pop(enemy.sprite.x, enemy.sprite.y - 116, "꿈결 폭발!");
    const splashDamage = 3 + Math.floor(this.dreamResonance / 4);
    const nearby = this.enemies.filter(
      (other) => other.alive && other !== enemy && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, other.sprite.x, other.sprite.y) < 150
    );
    for (const other of nearby.slice(0, 3)) this.damageEnemy(other, splashDamage, false, "status");
  }

  private dreamBurstEffect(x: number, y: number) {
    const ring = this.add.circle(x, y, 18).setStrokeStyle(5, 0x72f4ff, 0.95).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.circle(x, y, 10, 0xff7b5e, 0.9).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [ring, core],
      scale: 4.4,
      alpha: 0,
      duration: 340,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ring.destroy();
        core.destroy();
      }
    });
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const ray = this.add.rectangle(x, y, 28, 3, index % 2 === 0 ? 0x72f4ff : 0xff8c68, 0.9)
        .setRotation(angle)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ray,
        x: x + Math.cos(angle) * 92,
        y: y + Math.sin(angle) * 92,
        alpha: 0,
        duration: 280,
        ease: "Quad.easeOut",
        onComplete: () => ray.destroy()
      });
    }
    this.cameras.main.shake(130, 0.004);
  }

  private updateEnemyDreamStatus(enemy: Enemy, time: number) {
    if (!this.phase4Mode()) return;
    if ((enemy.burnStacks ?? 0) > 0 && time >= (enemy.burnUntil ?? 0)) {
      enemy.burnStacks = 0;
    }
    if ((enemy.burnStacks ?? 0) > 0 && time >= (enemy.nextBurnTick ?? 0)) {
      enemy.nextBurnTick = time + 650;
      const burnDamage = (enemy.burnStacks ?? 0) + Math.floor(this.dreamParts.cometHammer / 2);
      this.flash(enemy.sprite.x, enemy.sprite.y - 18, 0xff6048);
      this.damageEnemy(enemy, burnDamage, false, "status");
    }
    if (!enemy.alive) return;
    this.updateEnemyStatusBadge(enemy, time);
  }

  private updateEnemyStatusBadge(enemy: Enemy, time = this.time.now) {
    if (!enemy.statusBadge) return;
    const marked = (enemy.moonMarkedUntil ?? 0) > time;
    const burning = (enemy.burnStacks ?? 0) > 0 && (enemy.burnUntil ?? 0) > time;
    const label = marked && burning
      ? `달빛 표식 · 연소 ${enemy.burnStacks}`
      : marked
        ? "달빛 표식"
        : burning
          ? `혜성 연소 ${enemy.burnStacks}`
          : "";
    enemy.statusBadge
      .setText(label)
      .setColor(marked ? "#82f7ff" : "#ff9c68")
      .setVisible(Boolean(label));
  }

  private updateEnemyBars(enemy: Enemy) {
    if (!this.phase4Mode()) return;
    enemy.healthBar?.setScale(Phaser.Math.Clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1), 1);
    const maxArmor = enemy.maxArmor ?? 0;
    enemy.armorBar?.setVisible(maxArmor > 0 && (enemy.armor ?? 0) > 0).setScale(maxArmor > 0 ? Phaser.Math.Clamp((enemy.armor ?? 0) / maxArmor, 0, 1) : 0, 1);
    const maxBreak = enemy.maxBreak ?? 0;
    enemy.breakBar?.setVisible(maxBreak > 0).setScale(maxBreak > 0 ? Phaser.Math.Clamp((enemy.breakValue ?? 0) / maxBreak, 0, 1) : 0, 1);
    enemy.rangeBadge?.setAlpha((enemy.brokenUntil ?? 0) > this.time.now ? 0.35 : 1);
  }

  private enterBossPhaseTwo(enemy: Enemy) {
    enemy.bossPhase = 2;
    enemy.speed *= 1.35;
    enemy.nextShot = this.time.now + 400;
    enemy.nextSpecial = this.time.now + 900;
    enemy.weakUntil = this.time.now + 1500;
    enemy.weakpoint?.setVisible(true);
    if (enemy.glow) {
      enemy.glow.color = this.currentTheme().accent;
      this.tweens.add({ targets: enemy.glow, outerStrength: 8, yoyo: true, duration: 420 });
    }
    this.punchCameraFilter(6, 0.86, 650);
    const flash = this.add.rectangle(480, 270, 960, 540, this.currentTheme().accent, 0.22).setDepth(18);
    this.tweens.add({ targets: flash, alpha: 0, duration: 560, onComplete: () => flash.destroy() });
    this.cameras.main.shake(440, 0.014);
    this.showStatus("2단계 - 폭주", "boss", 1500);
  }

  private finishStage() {
    if (this.phase4Mode()) this.awardBossLoot();
    this.stageReport = this.buildStageReport();
    this.gold += this.stageReport.bonus;
    this.clearCombat();
    this.runCompletePending = this.phase4Mode() ? this.wave >= DREAM_STAGE_COUNT : this.wave >= STAGES.length;
    this.openShop();
  }

  private openShop() {
    this.inShop = true;
    this.workshopUpgradesPurchased = 0;
    this.workshopUpgradeKindsPurchased.clear();
    this.isPointerDown = false;
    this.activeTouchMoves.clear();
    this.updateTouchMove();
    this.coverIndicator.setVisible(false);
    this.shopOverlay.classList.toggle("phase4-shop", this.phase4Mode());
    this.shopOverlay.classList.toggle("phase4-stage2-shop", this.phase4Mode() && this.wave === 2);
    this.shopOverlay.classList.toggle("phase4-stage3-shop", this.phase4Mode() && this.wave === 3);
    this.shopOverlay.classList.toggle("phase4-stage4-shop", this.phase4Mode() && this.wave === 4);
    this.shopOverlay.classList.remove("hidden");
    this.shopTitle.textContent = this.phase4Mode() ? `꿈 작업대 - ${this.weaponGrade()}등급 개조` : this.runCompletePending ? "도전 완료" : `총기 작업대 - ${this.wave}단계 완료`;
    this.continueButton.textContent = this.phase4Mode()
      ? this.runCompletePending ? "꿈 마치기" : "다음 꿈으로"
      : this.runCompletePending ? "도전 마치기" : "다음 단계";
    this.renderStageReport();
    this.updateShop();
  }

  private awardBossLoot() {
    const available = (Object.keys(DREAM_PARTS) as DreamPartKind[]).filter(
      (kind) => this.dreamParts[kind] < DREAM_PARTS[kind].max
    );
    if (available.length === 0) {
      this.dreamResonance += LOOT_RARITIES.legendary.resonance;
      this.bestLootRank = Math.max(this.bestLootRank, this.rarityRank("legendary"));
      this.bossLootSummary = "보스 전리품: 전설 공명핵 +4";
      return;
    }
    const lowestLevel = Math.min(...available.map((kind) => this.dreamParts[kind]));
    const lowestParts = available.filter((kind) => this.dreamParts[kind] === lowestLevel);
    const kind = Phaser.Utils.Array.GetRandom(lowestParts);
    const accuracy = this.shotsFired > 0 ? this.shotsHit / this.shotsFired : 0;
    const resonanceMastery = this.stageCoreBreaks >= 2 && this.stageDreamBursts >= 2;
    const legendaryMastery = (accuracy >= 0.82 && this.stageDamageTaken === 0 && this.stageCoreBreaks >= 2)
      || (resonanceMastery && accuracy >= 0.72);
    const epicMastery = (accuracy >= 0.62 && this.stageDamageTaken <= 2) || resonanceMastery;
    const rarity: LootRarity = legendaryMastery ? "legendary" : epicMastery ? "epic" : "rare";
    const rarityInfo = LOOT_RARITIES[rarity];
    const gain = Math.min(rarityInfo.gain, DREAM_PARTS[kind].max - this.dreamParts[kind]);
    this.dreamParts[kind] += gain;
    this.dreamResonance += rarityInfo.resonance;
    this.bestLootRank = Math.max(this.bestLootRank, this.rarityRank(rarity));
    this.maxCoverHp = this.coverCapacity();
    this.coverHp = this.maxCoverHp;
    this.applyCoverVisualState();
    this.bossLootSummary = `보스 전리품: ${rarityInfo.label} ${DREAM_PARTS[kind].label} +${gain}`;
  }

  private leaveShop() {
    if (!this.inShop || this.loadingChapter) return;
    if (this.runCompletePending) {
      this.inShop = false;
      this.shopOverlay.classList.add("hidden");
      this.isGameOver = true;
      this.statusText.classList.add("large");
      this.updateHud("도전 완료 - R키로 다시 시작");
      void this.openLeaderboard(this.buildLeaderboardSubmission(true));
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
    points += this.stageCoreBreaks >= 3 ? 2 : this.stageCoreBreaks >= 1 ? 1 : 0;
    const grade: StageReport["grade"] = points >= 9 ? "S" : points >= 7 ? "A" : points >= 5 ? "B" : "C";
    const bonus = this.phase4Mode()
      ? { S: 7, A: 5, B: 3, C: 1 }[grade]
      : { S: 15, A: 10, B: 6, C: 2 }[grade];
    return {
      grade,
      accuracy,
      maxCombo: this.stageMaxCombo,
      damageTaken: this.stageDamageTaken,
      clearTime,
      eliteKills: this.stageEliteKills,
      coreBreaks: this.stageCoreBreaks,
      bonus
    };
  }

  private renderStageReport() {
    if (!this.stageReport) {
      this.stageReportText.classList.add("empty");
      this.stageReportText.textContent = "다음 무기를 개조하세요";
      return;
    }
    const report = this.stageReport;
    this.stageReportText.classList.remove("empty");
    this.stageReportText.innerHTML = `
      <strong class="grade grade-${report.grade.toLowerCase()}">${report.grade}</strong>
      <span><b>${report.accuracy}%</b><small>명중률</small></span>
      <span><b>x${report.maxCombo}</b><small>최대 연속</small></span>
      <span><b>${report.damageTaken}</b><small>피해</small></span>
      <span><b>${report.clearTime}초</b><small>시간</small></span>
      <span><b>${report.eliteKills}</b><small>정예 처치</small></span>
      <span><b>${report.coreBreaks}</b><small>핵 붕괴</small></span>
      <em>+${report.bonus}${this.phase4Mode() ? "꿈가루" : "골드"}</em>`;
  }

  private buyShopItem(kind: "damage" | "range" | "reload" | "pierce" | "life" | "potion" | "dynamite") {
    const permanentUpgrade = kind !== "potion" && kind !== "dynamite";
    const cost = kind === "potion"
      ? this.phase4Mode() ? 7 : 4
      : kind === "dynamite"
        ? this.phase4Mode() ? 12 : 6
        : this.upgradeCost(kind);
    if (permanentUpgrade && this.upgradeLevel(kind) >= this.upgradeMax(kind)) {
      this.updateHud("이미 최대 단계입니다");
      return;
    }
    if (this.phase4Mode() && permanentUpgrade && this.workshopUpgradesPurchased >= PHASE4_WORKSHOP_UPGRADE_LIMIT) {
      this.updateHud("이번 작업대의 영구 개조 슬롯을 모두 사용했습니다");
      return;
    }
    if (this.phase4Mode() && permanentUpgrade && this.workshopUpgradeKindsPurchased.has(kind)) {
      this.updateHud("같은 부품은 다음 작업대에서 다시 개조할 수 있습니다");
      return;
    }
    if (kind === "dynamite" && this.dynamite >= 3) {
      this.updateHud("다이너마이트가 가득 찼습니다");
      return;
    }
    if (this.gold < cost) {
      this.updateHud("골드가 부족합니다");
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
      if (this.phase4Mode()) {
        this.maxCoverHp = this.coverCapacity();
        this.coverHp = this.maxCoverHp;
        this.applyCoverVisualState();
      }
    } else if (kind === "potion") {
      this.lives = Math.min(this.maxLives, this.lives + 2);
      if (this.phase4Mode()) {
        this.coverBrokenUntil = 0;
        this.coverHp = this.maxCoverHp;
        this.applyCoverVisualState();
      }
    } else if (kind === "dynamite") {
      this.dynamite += 1;
    }
    if (permanentUpgrade) {
      this.workshopUpgradesPurchased += 1;
      this.workshopUpgradeKindsPurchased.add(kind);
    }
    this.updateHud(
      kind === "potion" || kind === "dynamite"
        ? "보급 완료"
        : this.phase4Mode()
          ? `${this.weaponGrade()}등급 꿈 무기 개조 완료`
          : "무기 개조 완료"
    );
    this.updateShop();
  }

  private updateShop() {
    const phase4 = this.phase4Mode();
    const setLabels = this.dreamSetLabels();
    if (phase4) this.shopTitle.textContent = `꿈 작업대 - ${this.weaponGrade()}등급 개조`;
    this.shopGoldText.textContent = this.phase4Mode()
      ? `꿈가루 ${this.gold} | 영구 개조 ${this.workshopUpgradesPurchased}/${PHASE4_WORKSHOP_UPGRADE_LIMIT} | ${this.weaponName()} | 공명 ${this.dreamResonance} | 엄폐 ${this.maxCoverHp}`
      : `골드 ${this.gold} | ${this.weaponName()} | 공격 ${this.gunDamageLevel} 범위 ${this.gunRangeLevel} 장전 ${this.gunReloadLevel} 관통 ${this.gunPierceLevel}`;
    this.shopBuildText.textContent = this.phase4Mode()
      ? `${this.bossLootSummary ? `${this.bossLootSummary} | ` : ""}세트: ${setLabels.join(" + ") || "미완성"} | 부품: ${Object.entries(this.dreamParts).filter(([, level]) => level > 0).map(([kind, level]) => `${DREAM_PARTS[kind as DreamPartKind].label} ${level}`).join(" + ") || "없음"}`
      : this.synergySummary();
    this.buyDamageButton.innerHTML = this.upgradeHtml(phase4 ? "dream-comet-powder" : "shotgun", phase4 ? "혜성 화약" : "강화 화약", "damage", `공격력 +1`);
    this.buyRangeButton.innerHTML = this.upgradeHtml(phase4 ? "dream-moon-lens" : "rifle", phase4 ? "달빛 렌즈" : "장총열", "range", `명중 범위 +10`);
    this.buyReloadButton.innerHTML = this.upgradeHtml(phase4 ? "dream-clockwork" : "gatling", phase4 ? "꿈 태엽" : "속사 방아쇠", "reload", phase4 ? "발사·장전 속도 증가" : "재장전 -32밀리초");
    this.buyPierceButton.innerHTML = this.upgradeHtml(phase4 ? "dream-star-needle" : "rifle", phase4 ? "별 관통침" : "관통 장치", "pierce", `관통 대상 +1`);
    this.buyLifeButton.innerHTML = this.upgradeHtml(phase4 ? "dream-guardian-star" : "potion", phase4 ? "수호 별조각" : "강철 심장", "life", phase4 ? "생명력 +1, 엄폐 +10" : "최대 생명력 +1");
    this.buyPotionButton.innerHTML = phase4
      ? `<i class="item-icon dream-repair-elixir"></i><span>꿈결 수리액</span><small>7꿈가루 | 생명력·엄폐 복구</small>`
      : `<i class="item-icon potion"></i><span>회복 물약</span><small>4골드 | 생명력 2 회복</small>`;
    this.buyDynamiteButton.innerHTML = phase4
      ? `<i class="item-icon dream-constellation-bomb"></i><span>별무리 폭탄</span><small>12꿈가루 | 화면 전체 붕괴</small>`
      : `<i class="item-icon dynamite"></i><span>다이너마이트</span><small>6골드 | 화면 전체 공격, 최대 3개</small>`;
    const workshopFull = phase4 && this.workshopUpgradesPurchased >= PHASE4_WORKSHOP_UPGRADE_LIMIT;
    this.buyDamageButton.disabled = workshopFull || this.workshopUpgradeKindsPurchased.has("damage") || this.gunDamageLevel >= this.upgradeMax("damage");
    this.buyRangeButton.disabled = workshopFull || this.workshopUpgradeKindsPurchased.has("range") || this.gunRangeLevel >= this.upgradeMax("range");
    this.buyReloadButton.disabled = workshopFull || this.workshopUpgradeKindsPurchased.has("reload") || this.gunReloadLevel >= this.upgradeMax("reload");
    this.buyPierceButton.disabled = workshopFull || this.workshopUpgradeKindsPurchased.has("pierce") || this.gunPierceLevel >= this.upgradeMax("pierce");
    this.buyLifeButton.disabled = workshopFull || this.workshopUpgradeKindsPurchased.has("life") || this.maxLifeLevel >= this.upgradeMax("life");
    this.buyPotionButton.disabled = phase4
      ? this.lives >= this.maxLives && this.coverHp >= this.maxCoverHp && this.coverBrokenUntil <= this.time.now
      : this.lives >= this.maxLives;
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
    if (this.phase4Mode()) {
      const base = { damage: 9, range: 8, reload: 10, pierce: 14, life: 12 }[kind];
      const step = { damage: 7, range: 6, reload: 7, pierce: 10, life: 9 }[kind];
      return base + level * step;
    }
    const base = { damage: 6, range: 5, reload: 7, pierce: 10, life: 8 }[kind];
    return base + level * (kind === "pierce" ? 10 : kind === "life" ? 8 : 6);
  }

  private upgradeHtml(icon: string, label: string, kind: "damage" | "range" | "reload" | "pierce" | "life", detail: string) {
    const level = this.upgradeLevel(kind);
    const max = this.upgradeMax(kind);
    const currency = this.phase4Mode() ? "꿈가루" : "골드";
    const price = level >= max ? "최대" : `${this.upgradeCost(kind)}${currency}`;
    return `<i class="item-icon ${icon}"></i><span>${label} ${level}/${max}</span><small>${price} | ${detail}</small>`;
  }

  private weaponStats() {
    const blue = this.activeBrother === "blue";
    const deadeye = this.activeEvent?.kind === "deadeye";
    const wideBore = this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1;
    const dreamDamage = this.dreamParts.cometHammer;
    const dreamTempo = Math.pow(0.9, this.dreamParts.cometHammer);
    const dreamSets = this.dreamSetState();
    const resonanceDamage = Math.floor(this.dreamResonance / 6);
    return {
      damage: 1 + this.gunDamageLevel + this.fieldUpgrades.highCaliber + dreamDamage + resonanceDamage + (dreamSets.comet ? 1 : 0) + (blue ? 0 : 1),
      radius: 28 + this.gunRangeLevel * 10 + this.dreamParts.moonChoke * 8 + (dreamSets.lunar ? 10 : 0) + (blue ? 0 : 14),
      delay: Math.round(Math.max(72, 210 - this.gunReloadLevel * 27) * Math.pow(0.88, this.fieldUpgrades.quickdraw) * dreamTempo * (blue ? 0.76 : 1.24) * (deadeye ? 0.72 : 1)),
      extraHits: (blue ? 0 : 2) + (wideBore ? 2 : 0),
      pierce: this.gunPierceLevel + this.fieldUpgrades.piercingRounds + (deadeye ? 2 : 0),
      shake: Math.max(18, 45 - this.gunReloadLevel * 3),
      critChance: (this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2 ? 0.2 : blue ? 0.06 : 0) + (dreamSets.guardian ? 0.12 : 0),
      explosive: this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1
    };
  }

  private rangeDamageMultiplier(enemy: Enemy) {
    if (!this.phase4Mode() || !enemy.rangeBand) return 1;
    if (this.activeBrother === "blue") {
      return { near: 0.88, mid: 1.18, far: 1.28 }[enemy.rangeBand];
    }
    const choke = this.dreamParts.moonChoke;
    return {
      near: 1.55,
      mid: 0.82 + choke * 0.1,
      far: 0.38 + choke * 0.12
    }[enemy.rangeBand];
  }

  private weaponName() {
    if (this.phase4Mode()) {
      const partLevel = Object.values(this.dreamParts).reduce((sum, level) => sum + level, 0);
      const name = partLevel >= 5
        ? this.activeBrother === "blue" ? "각성의 별" : "신성 폭발포"
        : partLevel >= 2
          ? this.activeBrother === "blue" ? "달빛 연발총" : "꿈결 산탄총"
          : this.activeBrother === "blue" ? "별빛 리볼버" : "장난감 블래스터";
      return `${this.weaponGrade()} · ${name}`;
    }
    if (this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1) return this.activeBrother === "blue" ? "발전기 연발총" : "천둥 산탄총";
    if (this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2) return "총잡이 시계";
    if (this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1) return "광역 총열";
    const total = this.gunDamageLevel + this.gunRangeLevel + this.gunReloadLevel + this.gunPierceLevel;
    if (total >= 6) return this.activeBrother === "blue" ? "황동 독사" : "폭발봉 2호";
    return this.activeBrother === "blue" ? "평화의 권총" : "산탄총";
  }

  private synergySummary() {
    const synergies: string[] = [];
    if (this.gunDamageLevel >= 2 && this.gunPierceLevel >= 1) synergies.push("발전기 탄환");
    if (this.gunDamageLevel >= 2 && this.gunReloadLevel >= 2) synergies.push("총잡이 시계");
    if (this.gunRangeLevel >= 2 && this.gunDamageLevel >= 1) synergies.push("광역 총열");
    if (this.gunDamageLevel >= 3 && this.dynamite > 0) synergies.push("황금 도화선");
    return synergies.length > 0 ? `조합 효과: ${synergies.join(" + ")}` : "조합 효과 없음 - 개조 부품을 조합하세요";
  }

  private throwDynamite() {
    if (this.isGameOver || this.inShop || this.inFieldUpgrade || this.dynamite <= 0) {
      if (!this.inShop && !this.inFieldUpgrade && this.dynamite <= 0) this.updateHud("다이너마이트가 없습니다");
      return;
    }
    this.dynamite -= 1;
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    for (const enemy of liveEnemies) {
      const bossDamageRatio = this.phase4Mode() ? 0.16 : 0.28;
      this.damageEnemy(enemy, enemy.isBoss ? Math.ceil(enemy.maxHp * bossDamageRatio) : 999, false, "dynamite");
    }
    this.cameras.main.shake(420, 0.018);
    this.punchCameraFilter(9, 0.78, 760);
    this.updateHud("다이너마이트!");
  }

  private damagePlayer() {
    if (this.hasActiveDreamCover()) {
      this.damageCover(8);
      return;
    }
    this.lives -= 1;
    this.stageDamageTaken += 1;
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 2100;
    this.damageFlash.classList.remove("show");
    void this.damageFlash.offsetWidth;
    this.damageFlash.classList.add("show");
    this.player.setAlpha(0.62);
    this.cameras.main.shake(220, 0.01);
    this.punchCameraFilter(2, 0.95, 280);
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
    if (this.phase4Mode()) this.setPlayerPose("cover");
    else this.playerSprite.setFrame(this.activeBrother === "blue" ? "heroBlue" : "heroRed").setDisplaySize(104, 112);
    this.lives = Math.max(2, Math.ceil(this.maxLives / 2));
    this.invulnerableUntil = this.time.now + 3500;
    for (const bullet of [...this.bullets]) this.destroyBullet(bullet);
    this.player.setAlpha(1);
    this.cameras.main.flash(240, 245, 192, 82);
    this.showStatus("형제 구출!", "boss", 1500);
    this.updateHud();
  }

  private offerContinue() {
    this.isGameOver = true;
    this.waitingForContinue = this.continuesLeft > 0;
    this.statusText.classList.add("large");
    if (this.waitingForContinue) {
      this.updateHud(`계속하시겠습니까? 남은 기회 ${this.continuesLeft}회 - 엔터/터치`);
    } else {
      this.updateHud("게임 종료 - R키로 다시 시작");
      this.time.delayedCall(250, () => void this.openLeaderboard(this.buildLeaderboardSubmission(false)));
    }
  }

  private continueGame() {
    if (!this.waitingForContinue || this.continuesLeft <= 0) return;
    this.continuesLeft -= 1;
    this.isGameOver = false;
    this.waitingForContinue = false;
    this.lives = this.maxLives;
    if (this.phase4Mode()) {
      this.coverHp = this.maxCoverHp;
      this.coverBrokenUntil = 0;
      this.coverInvulnerableUntil = this.time.now + 1600;
      this.applyCoverVisualState();
    }
    this.combo = 0;
    this.invulnerableUntil = this.time.now + 3200;
    this.player.setAlpha(1);
    for (const bullet of [...this.bullets]) this.destroyBullet(bullet);
    this.player.setPosition(480, 442);
    this.playerBody.setPosition(480, 442);
    this.statusText.classList.remove("large");
    this.updateHud(`이어하기! 남은 기회 ${this.continuesLeft}회`);
  }

  private bulletHitsRect(bullet: Bullet, rect: Phaser.GameObjects.Rectangle) {
    const bounds = rect.getBounds();
    const x = Phaser.Math.Clamp(bullet.sprite.x, bounds.left, bounds.right);
    const y = Phaser.Math.Clamp(bullet.sprite.y, bounds.top, bounds.bottom);
    const radius = bullet.radius * bullet.sprite.scaleX;
    return Phaser.Math.Distance.Squared(x, y, bullet.sprite.x, bullet.sprite.y) <= radius * radius;
  }

  private interceptBulletAt(x: number, y: number, radius: number) {
    const interceptRadius = Phaser.Math.Clamp(radius * 0.72, 28, 52);
    let target: Bullet | undefined;
    let closest = Number.POSITIVE_INFINITY;
    for (const bullet of this.bullets) {
      if (bullet.fromPlayer) continue;
      const distance = Phaser.Math.Distance.Between(x, y, bullet.sprite.x, bullet.sprite.y);
      const hitRadius = interceptRadius + bullet.radius * bullet.sprite.scaleX;
      if (distance > hitRadius || distance >= closest) continue;
      target = bullet;
      closest = distance;
    }
    if (!target) return false;
    const impactX = target.sprite.x;
    const impactY = target.sprite.y;
    const kind = target.kind;
    this.destroyBullet(target);
    this.projectileImpact(impactX, impactY, kind, false, true);
    this.score += 75;
    this.tagMeter = Phaser.Math.Clamp(this.tagMeter + 6, 0, 100);
    if (this.phase4Mode() && this.coverBrokenUntil <= this.time.now) {
      const repair = this.dreamSetState().guardian ? 6 : 3;
      this.coverHp = Math.min(this.maxCoverHp, this.coverHp + repair);
      this.applyCoverVisualState();
    }
    this.pop(impactX, impactY, this.phase4Mode() ? `정밀 방어 +엄폐 ${this.dreamSetState().guardian ? 6 : 3}` : "정밀 방어");
    this.updateHud();
    return true;
  }

  private spawnBulletTrail(bullet: Bullet) {
    if (!bullet.sprite.active) return;
    const colors: Record<EnemyProjectileKind, number> = {
      star: 0xffca55,
      orb: 0xb875ff,
      comet: 0xff4566,
      nightmare: 0xe15bff
    };
    const widths: Record<EnemyProjectileKind, number> = { star: 10, orb: 9, comet: 18, nightmare: 14 };
    const heights: Record<EnemyProjectileKind, number> = { star: 3, orb: 6, comet: 3, nightmare: 7 };
    const startScale = bullet.sprite.scaleX;
    const trail = this.add.rectangle(
      bullet.sprite.x,
      bullet.sprite.y,
      widths[bullet.kind],
      heights[bullet.kind],
      colors[bullet.kind],
      bullet.kind === "comet" ? 0.48 : 0.34
    );
    trail
      .setRotation(bullet.sprite.rotation)
      .setScale(startScale)
      .setDepth(Math.max(8, bullet.sprite.depth - 1))
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: startScale * 0.35,
      scaleY: startScale * 0.6,
      duration: bullet.kind === "comet" ? 120 : 155,
      ease: "Cubic.easeOut",
      onComplete: () => trail.destroy()
    });
  }

  private projectileImpact(x: number, y: number, kind: EnemyProjectileKind, blocked = false, intercepted = false) {
    const colors: Record<EnemyProjectileKind, number> = {
      star: 0xffc95c,
      orb: 0x9f71ff,
      comet: 0xff5369,
      nightmare: 0xe856ff
    };
    const color = blocked ? 0x73efff : intercepted ? 0xffffff : colors[kind];
    const radius = kind === "nightmare" ? 28 : kind === "orb" ? 22 : 16;
    const ring = this.add.circle(x, y, radius * 0.45).setStrokeStyle(intercepted ? 5 : 3, color, 0.95).setDepth(15);
    const core = this.add.circle(x, y, intercepted ? 8 : 5, 0xffffff, 0.92).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [ring, core],
      scale: intercepted ? 2.6 : 2,
      alpha: 0,
      duration: intercepted ? 230 : 170,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ring.destroy();
        core.destroy();
      }
    });
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6 + Phaser.Math.FloatBetween(-0.18, 0.18);
      const distance = Phaser.Math.Between(intercepted ? 28 : 18, intercepted ? 52 : 34);
      const spark = this.add.rectangle(x, y, Phaser.Math.Between(5, 10), 2, color, 0.95)
        .setRotation(angle)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: Phaser.Math.Between(130, 220),
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
    if (blocked || intercepted) this.cameras.main.shake(intercepted ? 100 : 65, intercepted ? 0.003 : 0.0015);
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
        fontFamily: "Malgun Gothic, Noto Sans KR, sans-serif",
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
    const actDuration = Math.max(1, this.actEndsAt - this.actStartedAt);
    const actProgress = Phaser.Math.Clamp((this.time.now - this.actStartedAt) / actDuration, 0, 1);
    const phase4ActProgress = this.phase4Mode() ? Phaser.Math.Clamp(this.actDefeated / this.phase4Quota(), 0, 1) : actProgress;
    const progress = !this.gameStarted
      ? 0
      : boss
        ? Phaser.Math.Clamp((boss.hp / boss.maxHp) * 100, 0, 100)
        : this.bossSpawned
          ? 0
          : Phaser.Math.Clamp(((this.waveAct - 1 + phase4ActProgress) / WAVE_ACTS.length) * 100, 0, 100);
    const actSeconds = Math.max(0, Math.ceil((this.actEndsAt - this.time.now) / 1000));
    this.scoreText.textContent = this.score.toLocaleString("ko-KR");
    this.waveText.textContent = String(this.wave);
    this.stageNameText.textContent = this.currentTheme().name;
    this.livesText.innerHTML = Array.from(
      { length: this.maxLives },
      (_, index) => `<i class="${index < this.lives ? "full" : ""}"></i>`
    ).join("");
    this.goldText.textContent = String(this.gold);
    this.dynamiteText.textContent = `x${this.dynamite}`;
    this.ammoText.textContent = `${this.ammo}/${this.magazineSize()}`;
    const coverRatio = Phaser.Math.Clamp(this.coverHp / Math.max(1, this.maxCoverHp), 0, 1);
    const hasCoverHp = this.phase4Mode();
    const coverBroken = hasCoverHp && this.coverBrokenUntil > this.time.now;
    const repairSeconds = Math.max(0, Math.ceil((this.coverBrokenUntil - this.time.now) / 1000));
    this.ammoStateText.textContent = this.reloading ? "재장전" : hasCoverHp ? (coverBroken ? "탄약 / 위험" : this.covering ? "탄약 / 엄폐" : "탄약 / 노출") : "탄약";
    this.coverHpText.hidden = !hasCoverHp;
    this.coverHpMeter.hidden = !hasCoverHp;
    this.coverHpText.textContent = coverBroken ? `엄폐물 복구 ${repairSeconds}초` : `엄폐 ${Math.ceil(this.coverHp)}/${this.maxCoverHp}`;
    this.coverHpFill.style.width = `${Math.round(coverRatio * 100)}%`;
    this.coverHpFill.classList.toggle("danger", coverRatio <= 0.3);
    this.coverHpMeter.classList.toggle("broken", coverBroken);
    this.coverHpMeter.setAttribute("aria-valuenow", String(Math.round(coverRatio * 100)));
    this.ammoHud.classList.toggle("reloading", this.reloading);
    this.ammoHud.classList.toggle("firing", !this.reloading && !this.covering);
    this.comboText.textContent = this.bossSpawned
      ? this.currentTheme().bossName ?? "보스"
      : this.phase4Mode()
        ? `대상 ${this.actDefeated}/${this.phase4Quota()}`
        : `처치 ${this.stageKills}`;
    this.bossDistanceText.textContent = !this.gameStarted
      ? "막 I - 준비"
      : boss
      ? this.phase4Mode()
        ? `${boss.bossPhase}단계 - ${(boss.brokenUntil ?? 0) > this.time.now ? "핵 붕괴" : (boss.armor ?? 0) > 0 ? `장갑 ${Math.ceil(boss.armor ?? 0)}` : "핵을 붕괴시키세요"}`
        : `${boss.bossPhase}단계 - ${this.time.now < boss.weakUntil ? "약점 노출" : "공격 징조 확인"}`
      : this.bossSpawned
        ? "보스 격파"
        : this.inFieldUpgrade
          ? "강화 부품을 선택하세요"
          : this.actTransitioning
            ? "보스 접근 중"
            : this.phase4Mode()
              ? `막 ${act.numeral} - ${this.actDefeated}/${this.phase4Quota()}`
              : `막 ${act.numeral} - ${actSeconds}초`;
    this.wavePhaseText.textContent = boss ? `체력 ${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}` : this.bossSpawned ? "최종 결투" : `${act.numeral} / ${act.name}`;
    this.killProgress.style.width = `${progress}%`;
    this.killProgress.classList.toggle("boss", this.bossSpawned);
    this.killStreakText.innerHTML = `연속 처치 <strong>x${this.combo}</strong>`;
    this.killStreakText.classList.toggle("show", this.combo >= 3 && !this.inShop && !this.inFieldUpgrade && !this.isGameOver);
    this.brotherNameText.textContent = this.activeBrother === "blue" ? "파랑 / 정밀 사격" : "빨강 / 산탄 사격";
    this.tagProgress.style.width = `${this.tagMeter}%`;
    this.weaponNameText.textContent = this.weaponName();
    this.brotherTagButton.classList.toggle("red", this.activeBrother === "red");
    this.brotherTagButton.classList.toggle("ready", this.tagMeter >= 100);
    const markedEnemies = this.enemies.filter((enemy) => enemy.alive && (enemy.moonMarkedUntil ?? 0) > this.time.now).length;
    const burningEnemies = this.enemies.filter((enemy) => enemy.alive && (enemy.burnStacks ?? 0) > 0 && (enemy.burnUntil ?? 0) > this.time.now).length;
    this.combatSynergyText.classList.toggle("red", this.activeBrother === "red");
    this.combatSynergyText.classList.toggle("armed", this.activeBrother === "red" && markedEnemies > 0);
    this.combatSynergyText.hidden = !this.phase4Mode();
    this.combatSynergyValueText.textContent = this.activeBrother === "blue"
      ? markedEnemies > 0 ? `달빛 표식 x${markedEnemies}` : "달빛 표식 없음"
      : markedEnemies > 0 ? `꿈결 폭발 준비 x${markedEnemies}` : burningEnemies > 0 ? `혜성 연소 x${burningEnemies}` : "혜성 연소 없음";
    this.touchTagButton.classList.toggle("ready", this.tagMeter >= 100);
    if (this.inShop) this.updateShop();
    if (status) this.showStatus(status);
  }

  private showStatus(text: string, kind?: "stage" | "act" | "boss" | "minor", duration?: number) {
    this.statusTimer?.remove(false);
    const resolvedKind = kind ?? (text.startsWith("단계") ? "stage" : text.startsWith("보스") ? "boss" : "minor");
    this.statusText.textContent = text;
    this.statusText.classList.remove("stage", "act", "boss", "minor");
    this.statusText.classList.add("show", resolvedKind);
    const visibleFor = duration ?? (resolvedKind === "stage" ? 1800 : resolvedKind === "boss" ? 1600 : 980);
    this.statusTimer = this.time.delayedCall(visibleFor, () => {
      if (!this.isGameOver) this.statusText.classList.remove("show", "stage", "act", "boss", "minor");
    });
  }

  private stageTitle() {
    return `${this.wave}단계: ${this.currentTheme().name}`;
  }

  private currentTheme() {
    return STAGES[(this.wave - 1) % STAGES.length];
  }

  private hasActiveDreamCover() {
    return (
      this.phase4Mode() &&
      this.covering &&
      this.coverHp > 0 &&
      this.coverBrokenUntil <= this.time.now
    );
  }

  private damageCover(damage: number) {
    if (this.coverBrokenUntil > this.time.now || this.coverHp <= 0 || this.coverInvulnerableUntil > this.time.now) return;
    this.coverHp = Math.max(0, this.coverHp - damage);
    this.flash(this.player.x, this.player.y + 2, 0x77ecff);
    this.pop(this.player.x, this.player.y - 42, this.coverHp > 0 ? `엄폐 ${this.coverHp}` : "엄폐물 파괴");
    this.playerCover?.setTint(0xff8c9f);
    this.playerCoverFront?.setTint(0xff8c9f);
    this.time.delayedCall(110, () => {
      this.applyCoverVisualState();
    });
    if (this.coverHp <= 0) {
      this.coverBrokenUntil = this.time.now + this.coverRepairDuration;
      this.invulnerableUntil = Math.max(this.invulnerableUntil, this.time.now + 1100);
      this.covering = false;
      this.setPlayerPose(this.reloading ? "reload" : "aim");
      for (const bullet of [...this.bullets]) {
        if (!bullet.fromPlayer) this.destroyBullet(bullet);
      }
      this.applyCoverVisualState();
      this.cameras.main.shake(320, 0.014);
      this.punchCameraFilter(4, 0.9, 440);
      this.showStatus("엄폐물 파괴 - 이동하며 버티세요", "boss", 1500);
    }
    this.updateHud();
  }

  private updateCoverState(time: number) {
    if (!this.phase4Mode() || this.coverBrokenUntil <= 0 || time < this.coverBrokenUntil) return;
    this.coverBrokenUntil = 0;
    this.coverHp = Math.max(1, Math.round(this.maxCoverHp * 0.35));
    this.coverInvulnerableUntil = time + 1600;
    this.applyCoverVisualState();
    this.showStatus("엄폐물 응급 복구 완료", "act", 1200);
    if (!this.isPointerDown && !this.reloading) this.enterCover();
    this.updateHud();
  }

  private applyCoverVisualState() {
    if (!this.playerCover || !this.playerCoverFront) return;
    const broken = this.coverBrokenUntil > this.time.now || this.coverHp <= 0;
    const ratio = Phaser.Math.Clamp(this.coverHp / Math.max(1, this.maxCoverHp), 0, 1);
    for (const cover of [this.playerCover, this.playerCoverFront]) {
      cover.clearTint().setAlpha(broken ? 0.42 : 1);
      if (broken) cover.setTint(0x6b435f);
      else if (ratio <= 0.3) cover.setTint(0xff9a72);
      else if (ratio <= 0.65) cover.setTint(0xffd28a);
    }
  }

  private phase4Mode() {
    return Boolean(this.currentTheme().phase4);
  }

  private phase4Quota(actIndex = this.waveAct - 1) {
    const stageIndex = Phaser.Math.Clamp(this.wave - 1, 0, PHASE4_STAGE_QUOTAS.length - 1);
    return PHASE4_STAGE_QUOTAS[stageIndex][actIndex];
  }

  private setPlayerPose(pose: PlayerPose) {
    this.playerPose = pose;
    if (!this.phase4Mode() || !this.playerSprite) return;
    const prefix = this.activeBrother === "blue" ? "blue" : "red";
    const frame = `${prefix}${pose[0].toUpperCase()}${pose.slice(1)}`;
    this.playerSprite.setTexture(this.activeBrother === "blue" ? "phase4Blue" : "phase4Red", frame);
    this.playerSprite.setDisplaySize(PHASE4_PLAYER_SIZE, PHASE4_PLAYER_SIZE);
    const cropHeight = pose === "aim" || pose === "fire" ? 505 : 627;
    this.playerSprite.setCrop(0, 0, 627, cropHeight);
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
    const addQuadFrames = (textureKey: string, prefix: string) => {
      if (!this.textures.exists(textureKey)) return;
      const texture = this.textures.get(textureKey);
      const frames = [
        [`${prefix}Cover`, 0, 0],
        [`${prefix}Aim`, 627, 0],
        [`${prefix}Fire`, 0, 627],
        [`${prefix}Reload`, 627, 627]
      ] as const;
      for (const [name, x, y] of frames) if (!texture.has(name)) texture.add(name, 0, x, y, 627, 627);
    };
    addQuadFrames("phase4Blue", "blue");
    addQuadFrames("phase4Red", "red");
    const addToyFrames = (textureKey: string) => {
      if (!this.textures.exists(textureKey)) return;
      const texture = this.textures.get(textureKey);
      const frames = [
        ["toyBruiser", 0, 0],
        ["toyGuard", 627, 0],
        ["toySniper", 0, 627],
        ["toyShield", 627, 627]
      ] as const;
      for (const [name, x, y] of frames) if (!texture.has(name)) texture.add(name, 0, x, y, 627, 627);
    };
    addToyFrames("phase4Toys");
    addToyFrames("phase4WorkshopToys");
    addToyFrames("phase4LibraryToys");
    addToyFrames("phase4HarborToys");
    if (this.textures.exists("phase4Parts")) {
      const texture = this.textures.get("phase4Parts");
      const frames = [
        ["partMoonChoke", 0, 0],
        ["partStarCylinder", 627, 0],
        ["partCometHammer", 0, 627],
        ["partDreamGrip", 627, 627]
      ] as const;
      for (const [name, x, y] of frames) if (!texture.has(name)) texture.add(name, 0, x, y, 627, 627);
    }
    if (this.textures.exists("phase4Projectiles")) {
      const texture = this.textures.get("phase4Projectiles");
      const frames = [
        ["projectileStar", 0, 0],
        ["projectileOrb", 627, 0],
        ["projectileComet", 0, 627],
        ["projectileNightmare", 627, 627]
      ] as const;
      for (const [name, x, y] of frames) if (!texture.has(name)) texture.add(name, 0, x, y, 627, 627);
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

  private actDurationMs(actIndex: number) {
    const debugSeconds = Number(new URLSearchParams(window.location.search).get("actSeconds"));
    if (Number.isFinite(debugSeconds) && debugSeconds >= 2 && debugSeconds <= 60) return debugSeconds * 1000;
    return WAVE_ACTS[actIndex].duration;
  }

  private beginAct(actNumber: number, announce = true) {
    this.waveAct = Phaser.Math.Clamp(actNumber, 1, WAVE_ACTS.length);
    this.actTransitioning = false;
    this.inFieldUpgrade = false;
    this.fieldUpgradeOverlay.classList.add("hidden");
    this.fieldUpgradeOverlay.setAttribute("aria-hidden", "true");
    this.ammo = this.magazineSize();
    this.reloading = false;
    if (this.phase4Mode()) {
      this.coverHp = Math.min(this.maxCoverHp, this.coverHp + 28);
      this.applyCoverVisualState();
    }
    this.enterCover();
    this.actStartedAt = this.time.now;
    this.actEndsAt = this.phase4Mode() ? Number.POSITIVE_INFINITY : this.time.now + this.actDurationMs(this.waveAct - 1);
    this.actSpawned = 0;
    this.actDefeated = 0;
    this.nextSpawn = this.time.now + 260;
    const act = WAVE_ACTS[this.waveAct - 1];
    const count = this.phase4Mode() ? Math.min(3, this.phase4Quota()) : Math.min(4 + this.waveAct + Math.floor(this.wave / 3), act.cap);
    for (let index = 0; index < count; index += 1) this.spawnEnemy(!this.phase4Mode() && this.waveAct > 1 && index === count - 1);
    if (announce) {
      this.showStatus(this.phase4Mode() ? `꿈속 전투 막 ${act.numeral} - ${act.name}` : `막 ${act.numeral} - ${act.callout}`, "act", 1500);
      if (!this.phase4Mode()) this.startStageEvent();
    }
    this.updateHud();
  }

  private completeAct() {
    if (this.bossSpawned || this.actTransitioning || this.inFieldUpgrade) return;
    this.actTransitioning = true;
    this.isPointerDown = false;
    this.activeTouchMoves.clear();
    this.updateTouchMove();
    this.clearCombat();
    this.activeEvent = undefined;
    this.applyStageColorGrade();
    this.eventBanner.className = "event-banner";
    this.eventBanner.textContent = "";
    this.hazardOverlay.className = "hazard-overlay";
    this.hazardZone?.sprite.destroy();
    this.hazardZone = undefined;
    this.ammo = this.magazineSize();
    this.reloading = false;
    this.enterCover();
    if (this.waveAct >= WAVE_ACTS.length) {
      this.showStatus("최종 구역 돌파 - 보스 접근 중", "boss", 1500);
      this.nextHazard = this.time.now + 4200;
      this.time.delayedCall(900, () => {
        if (!this.inShop && !this.isGameOver) this.spawnBoss();
      });
      return;
    }
    this.openFieldUpgrade();
  }

  private openFieldUpgrade() {
    if (this.phase4Mode()) {
      this.openDreamPartUpgrade();
      return;
    }
    const title = this.fieldUpgradeOverlay.querySelector("h2");
    const copy = this.fieldUpgradeOverlay.querySelector("#field-upgrade-copy");
    if (title) title.textContent = "강화 부품 선택";
    if (copy) copy.textContent = "이번 단계가 끝날 때까지 유지되는 강화 하나를 선택하세요.";
    const available = (Object.keys(FIELD_UPGRADES) as FieldUpgradeKind[]).filter(
      (kind) => this.fieldUpgrades[kind] < FIELD_UPGRADES[kind].max
    );
    if (available.length === 0) {
      this.gold += 10;
      this.beginAct(this.waveAct + 1);
      return;
    }
    this.inFieldUpgrade = true;
    this.fieldUpgradeChoices = Phaser.Utils.Array.Shuffle([...available]).slice(0, 3);
    this.fieldUpgradeOptions.replaceChildren();
    this.fieldUpgradeChoices.forEach((kind, index) => {
      const upgrade = FIELD_UPGRADES[kind];
      const level = this.fieldUpgrades[kind];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "field-upgrade-card";
      button.innerHTML = `<b>${index + 1}</b><i class="item-icon ${upgrade.icon}"></i><strong>${upgrade.label}</strong><span>${upgrade.detail}</span><small>레벨 ${level} &gt; ${level + 1}</small>`;
      button.addEventListener("click", () => this.chooseFieldUpgrade(index));
      this.fieldUpgradeOptions.append(button);
    });
    this.fieldUpgradeOverlay.classList.remove("hidden");
    this.fieldUpgradeOverlay.setAttribute("aria-hidden", "false");
    this.updateHud();
  }

  private chooseFieldUpgrade(index: number) {
    if (!this.inFieldUpgrade) return;
    if (this.phase4Mode()) {
      const loot = this.dreamPartChoices[index];
      if (!loot) return;
      const part = DREAM_PARTS[loot.kind];
      const gain = Math.min(loot.gain, part.max - this.dreamParts[loot.kind]);
      const setsBefore = this.dreamSetLabels();
      this.dreamParts[loot.kind] += gain;
      this.dreamResonance += LOOT_RARITIES[loot.rarity].resonance;
      this.bestLootRank = Math.max(this.bestLootRank, this.rarityRank(loot.rarity));
      const previousCoverMax = this.maxCoverHp;
      this.maxCoverHp = this.coverCapacity();
      this.coverHp = Math.min(this.maxCoverHp, this.coverHp + Math.max(0, this.maxCoverHp - previousCoverMax));
      this.applyCoverVisualState();
      const newSet = this.dreamSetLabels().find((label) => !setsBefore.includes(label));
      this.inFieldUpgrade = false;
      this.fieldUpgradeOverlay.classList.add("hidden");
      this.fieldUpgradeOverlay.setAttribute("aria-hidden", "true");
      this.showStatus(
        newSet
          ? `세트 활성화 - ${newSet}`
          : `${LOOT_RARITIES[loot.rarity].label} ${part.label} +${gain}`,
        "act",
        1350
      );
      this.beginAct(this.waveAct + 1, false);
      this.time.delayedCall(520, () => {
        if (!this.inShop && !this.isGameOver && !this.bossSpawned) {
          const act = WAVE_ACTS[this.waveAct - 1];
          this.showStatus(`꿈속 전투 막 ${act.numeral} - ${act.name}`, "act", 1350);
        }
      });
      return;
    }
    const kind = this.fieldUpgradeChoices[index];
    if (!kind) return;
    this.fieldUpgrades[kind] += 1;
    this.inFieldUpgrade = false;
    this.fieldUpgradeOverlay.classList.add("hidden");
    this.fieldUpgradeOverlay.setAttribute("aria-hidden", "true");
    this.showStatus(`${FIELD_UPGRADES[kind].label} 레벨 ${this.fieldUpgrades[kind]}`, "act", 1050);
    this.beginAct(this.waveAct + 1, false);
    this.time.delayedCall(520, () => {
      if (!this.inShop && !this.isGameOver && !this.bossSpawned) {
        const act = WAVE_ACTS[this.waveAct - 1];
        this.showStatus(`막 ${act.numeral} - ${act.callout}`, "act", 1350);
        this.startStageEvent();
      }
    });
  }

  private openDreamPartUpgrade() {
    const title = this.fieldUpgradeOverlay.querySelector("h2");
    const copy = this.fieldUpgradeOverlay.querySelector("#field-upgrade-copy");
    if (title) title.textContent = "꿈 전리품 선택";
    if (copy) copy.textContent = "등급이 높을수록 부품 레벨과 무기 공명이 더 크게 상승합니다.";
    const available = (Object.keys(DREAM_PARTS) as DreamPartKind[]).filter(
      (kind) => this.dreamParts[kind] < DREAM_PARTS[kind].max
    );
    if (available.length === 0) {
      this.gold += 10;
      this.beginAct(this.waveAct + 1);
      return;
    }
    this.inFieldUpgrade = true;
    this.dreamPartChoices = Phaser.Utils.Array.Shuffle([...available])
      .slice(0, 3)
      .map((kind) => this.rollDreamLoot(kind));
    if (this.dreamPartChoices.every((loot) => loot.rarity === "common")) {
      this.dreamPartChoices[0] = { ...this.dreamPartChoices[0], rarity: "rare", gain: LOOT_RARITIES.rare.gain };
    }
    this.fieldUpgradeOptions.replaceChildren();
    this.dreamPartChoices.forEach((loot, index) => {
      const part = DREAM_PARTS[loot.kind];
      const level = this.dreamParts[loot.kind];
      const gain = Math.min(loot.gain, part.max - level);
      const rarity = LOOT_RARITIES[loot.rarity];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `field-upgrade-card dream-part-card rarity-${loot.rarity}`;
      button.innerHTML = `<b>${index + 1}</b><em class="loot-rarity">${rarity.label}</em><i class="dream-part-icon ${loot.kind}"></i><strong>${part.label}</strong><span>${part.detail}</span><small>레벨 ${level} &gt; ${level + gain} · 공명 +${rarity.resonance}</small>`;
      button.addEventListener("click", () => this.chooseFieldUpgrade(index));
      this.fieldUpgradeOptions.append(button);
    });
    this.fieldUpgradeOverlay.classList.remove("hidden");
    this.fieldUpgradeOverlay.setAttribute("aria-hidden", "false");
    this.updateHud();
  }

  private rollDreamLoot(kind: DreamPartKind): DreamLootChoice {
    const luck = (this.waveAct - 1) * 8 + this.stageEliteKills * 4 + this.stageCoreBreaks * 6 + this.stageDreamBursts * 3;
    const roll = Phaser.Math.Between(1, 100) + luck;
    const rarity: LootRarity = roll >= 102 ? "legendary" : roll >= 78 ? "epic" : roll >= 40 ? "rare" : "common";
    return { kind, rarity, gain: LOOT_RARITIES[rarity].gain };
  }

  private rarityRank(rarity: LootRarity) {
    return { common: 0, rare: 1, epic: 2, legendary: 3 }[rarity];
  }

  private dreamSetState() {
    const lunar = this.dreamParts.moonChoke + this.dreamParts.starCylinder >= 3;
    const comet = this.dreamParts.cometHammer + this.dreamParts.dreamGrip >= 3;
    const guardian = Object.values(this.dreamParts).reduce((sum, level) => sum + level, 0) >= 5;
    return { lunar, comet, guardian };
  }

  private dreamSetLabels() {
    const sets = this.dreamSetState();
    const labels: string[] = [];
    if (sets.lunar) labels.push("달빛 탄창");
    if (sets.comet) labels.push("혜성 장인");
    if (sets.guardian) labels.push("꿈의 수호자");
    return labels;
  }

  private weaponGrade() {
    const partLevels = Object.values(this.dreamParts).reduce((sum, level) => sum + level, 0);
    const workshopLevels = this.gunDamageLevel + this.gunRangeLevel + this.gunReloadLevel + this.gunPierceLevel;
    const score = partLevels + workshopLevels + this.dreamResonance + this.bestLootRank;
    return score >= 14 ? "S" : score >= 10 ? "A" : score >= 6 ? "B" : score >= 3 ? "C" : "D";
  }

  private coverCapacity() {
    const guardianBonus = this.dreamSetState().guardian ? 25 : 0;
    return 100 + this.dreamParts.dreamGrip * 15 + this.maxLifeLevel * 10 + guardianBonus;
  }

  private startStageEvent(forcedKind?: EventKind) {
    if (this.activeEvent?.kind === "darkness") this.hazardOverlay.classList.remove("show", "darkness");
    const kind = forcedKind ?? STAGE_EVENTS[(this.wave + this.waveAct - 2) % STAGE_EVENTS.length];
    const labels: Record<EventKind, string> = {
      wanted: "현상 수배 - 보상 10골드",
      ambush: "기습 - 포위당했습니다",
      goldRush: "골드 광풍 - 골드 두 배",
      darkness: "정전 - 적 명중률 감소",
      deadeye: "정밀 사격 - 속사 및 관통"
    };
    this.activeEvent = { kind, endsAt: this.time.now + (kind === "wanted" ? 14000 : 10500) };
    this.applyStageColorGrade(kind);
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
    if (!this.phase4Mode() && !this.bossSpawned && !this.actTransitioning && this.actEndsAt > 0 && time >= this.actEndsAt) {
      this.completeAct();
      return;
    }
    if (this.activeEvent && time >= this.activeEvent.endsAt) {
      const wasDark = this.activeEvent.kind === "darkness";
      this.activeEvent = undefined;
      this.applyStageColorGrade();
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
    if (!this.phase4Mode() && time >= this.nextHazard) {
      this.nextHazard = time + (this.bossSpawned ? 10500 : 15500);
      this.triggerStageHazard();
    }
  }

  private triggerStageHazard() {
    const hazard = ["crossfire", "sandstorm", "train", "blast", "hellfire", "poison", "lightning", "fog", "hex", "roots"][(this.wave - 1) % 10];
    if (hazard === "sandstorm" || hazard === "fog") {
      this.hazardOverlay.classList.add("show", hazard);
      this.showStatus(hazard === "sandstorm" ? "협곡 모래폭풍" : "강안개", "minor", 1100);
      this.time.delayedCall(4200, () => this.hazardOverlay.classList.remove("show", hazard));
      return;
    }
    if (hazard === "poison" || hazard === "roots") {
      this.createHazardZone(hazard === "poison" ? 0x4cff72 : 0x9dff6a, hazard === "poison" ? "독꽃 개화" : "심장뿌리 출현");
      return;
    }
    if (hazard === "train") {
      const warning = this.add.rectangle(480, 348, 960, 76, 0xff5a36, 0.2).setDepth(7);
      this.showStatus("아이언 벨 급행열차", "minor", 1000);
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
      this.blastHazard(hazard === "hellfire" ? 0xff4c32 : 0xffbc4f, hazard === "hellfire" ? "지옥불" : "광산 폭발");
      return;
    }
    const color = hazard === "lightning" ? 0x7bfff2 : hazard === "hex" ? 0xc178ff : hazard === "hellfire" ? 0xff4c32 : 0xffbc4f;
    this.strikeHazard(color, hazard === "lightning" ? "늪지 번개" : hazard === "hex" ? "부두 저주" : "십자포화");
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
      enemy.aimGuide?.destroy();
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
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MumuBrothersScene]
};

createShell();
new Phaser.Game(config);
