export interface LeaderboardEntry {
  nickname: string;
  score: number;
  stage: number;
  chapter: number;
  grade: "D" | "C" | "B" | "A" | "S";
  cleared: number;
  elapsedMs: number;
  recordedAt: string;
}

export interface ScoreSubmission {
  score: number;
  stage: number;
  chapter: number;
  grade: LeaderboardEntry["grade"];
  cleared: boolean;
  elapsedMs: number;
}

export interface LeaderboardSnapshot {
  entries: LeaderboardEntry[];
  source: "online" | "local";
  pendingSync: number;
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbx-tJUJUuuFyrPNXPGDjbLGRai6QHNsNfR7bctrtmz9Hr8tE6eqGDuqqZ49ZbtzxD8bgA/exec";
const GAME_ID = "mumu-brothers";
const PLAYER_ID_KEY = "mumu-brothers-player-id-v1";
const NICKNAME_KEY = "mumu-brothers-nickname-v1";
const LOCAL_RANKING_KEY = "mumu-brothers-ranking-v1";
const PENDING_SYNC_KEY = "mumu-brothers-ranking-pending-v1";
const TOP_LIMIT = 10;
const FETCH_LIMIT = 50;

type LocalEntry = LeaderboardEntry & { playerId: string };

export const isOnlineLeaderboardConfigured = API_URL.startsWith("https://script.google.com/");

export function getLeaderboardNickname() {
  const saved = sanitizeNickname(localStorage.getItem(NICKNAME_KEY) || "");
  return saved || generatedNickname();
}

export function saveLeaderboardNickname(value: string) {
  const nickname = sanitizeNickname(value) || generatedNickname();
  localStorage.setItem(NICKNAME_KEY, nickname);
  return nickname;
}

export async function loadLeaderboard(chapter = 1): Promise<LeaderboardSnapshot> {
  const selectedChapter = normalizeChapter(chapter);
  const pendingSync = await flushPendingEntries();
  if (isOnlineLeaderboardConfigured) {
    try {
      const query = new URLSearchParams({
        action: "top",
        gameId: GAME_ID,
        chapter: String(selectedChapter),
        limit: String(FETCH_LIMIT)
      });
      const response = await fetchWithTimeout(`${API_URL}?${query.toString()}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = await response.json() as { ok?: boolean; entries?: unknown[]; error?: string };
      if (!response.ok || !payload.ok || !Array.isArray(payload.entries)) {
        throw new Error(payload.error || `랭킹 조회 실패: ${response.status}`);
      }
      return {
        entries: payload.entries
          .map(normalizeEntry)
          .filter((entry): entry is LeaderboardEntry => entry !== undefined && entry.chapter === selectedChapter)
          .sort(compareEntries)
          .slice(0, TOP_LIMIT),
        source: "online",
        pendingSync
      };
    } catch {
      // The local board remains usable when Apps Script is unavailable.
    }
  }
  return {
    entries: readLocalEntries().filter((entry) => entry.chapter === selectedChapter).slice(0, TOP_LIMIT),
    source: "local",
    pendingSync
  };
}

export async function submitLeaderboardScore(
  submission: ScoreSubmission,
  nicknameValue: string
): Promise<LeaderboardSnapshot> {
  const nickname = saveLeaderboardNickname(nicknameValue);
  const localEntry: LocalEntry = {
    playerId: getPlayerId(),
    nickname,
    score: Math.max(0, Math.floor(submission.score)),
    stage: Math.max(1, Math.floor(submission.stage)),
    chapter: Math.max(1, Math.floor(submission.chapter)),
    grade: submission.grade,
    cleared: submission.cleared ? 1 : 0,
    elapsedMs: Math.max(0, Math.floor(submission.elapsedMs)),
    recordedAt: new Date().toISOString()
  };
  saveLocalEntry(localEntry);
  queuePendingEntry(localEntry);

  if (isOnlineLeaderboardConfigured) {
    const pendingSync = await flushPendingEntries();
    if (pendingSync === 0) return loadLeaderboard(localEntry.chapter);
  }
  const pendingSync = readPendingEntries().length;
  return {
    entries: readLocalEntries().filter((entry) => entry.chapter === localEntry.chapter).slice(0, TOP_LIMIT),
    source: "local",
    pendingSync
  };
}

function getPlayerId() {
  const saved = localStorage.getItem(PLAYER_ID_KEY);
  if (saved) return saved;
  const created = createPlayerId();
  localStorage.setItem(PLAYER_ID_KEY, created);
  return created;
}

function sanitizeNickname(value: string) {
  const sanitized = value
    .replace(/[<>{}[\]"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
  const blocked = /(시발|씨발|병신|개새|좆|fuck|shit)/i;
  return blocked.test(sanitized) ? "" : sanitized;
}

function normalizeEntry(raw: unknown): LeaderboardEntry | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entry = raw as Partial<LeaderboardEntry>;
  const score = Number(entry.score);
  const stage = Number(entry.stage);
  if (!Number.isFinite(score) || !Number.isFinite(stage)) return undefined;
  const grade = ["D", "C", "B", "A", "S"].includes(String(entry.grade))
    ? entry.grade as LeaderboardEntry["grade"]
    : "D";
  return {
    nickname: sanitizeNickname(String(entry.nickname || "이름 없는 사수")) || "이름 없는 사수",
    score: Math.max(0, Math.floor(score)),
    stage: Math.max(1, Math.floor(stage)),
    chapter: Math.max(1, Math.floor(Number(entry.chapter) || 1)),
    grade,
    cleared: Number(entry.cleared) > 0 ? 1 : 0,
    elapsedMs: Math.max(0, Math.floor(Number(entry.elapsedMs) || 0)),
    recordedAt: String(entry.recordedAt || "")
  };
}

function readLocalEntries(): LocalEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_RANKING_KEY) || "[]") as unknown[];
    return saved
      .map((entry) => {
        const normalized = normalizeEntry(entry);
        const playerId = entry && typeof entry === "object" ? String((entry as Partial<LocalEntry>).playerId || "") : "";
        return normalized && playerId ? { ...normalized, playerId } : undefined;
      })
      .filter((entry): entry is LocalEntry => Boolean(entry))
      .sort(compareEntries);
  } catch {
    return [];
  }
}

function saveLocalEntry(entry: LocalEntry) {
  const current = readLocalEntries();
  const previous = current.find((item) => item.playerId === entry.playerId && item.chapter === entry.chapter);
  const next = previous && compareEntries(previous, entry) <= 0
    ? current
    : [entry, ...current.filter((item) => item.playerId !== entry.playerId || item.chapter !== entry.chapter)];
  localStorage.setItem(LOCAL_RANKING_KEY, JSON.stringify(next.sort(compareEntries).slice(0, 50)));
}

function generatedNickname() {
  return `꿈사수-${getPlayerId().slice(0, 4).toUpperCase()}`;
}

function normalizeChapter(chapter: number) {
  return chapter === 2 ? 2 : 1;
}

function createPlayerId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readPendingEntries(): LocalEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]") as unknown[];
    return saved
      .map((entry) => {
        const normalized = normalizeEntry(entry);
        const playerId = entry && typeof entry === "object" ? String((entry as Partial<LocalEntry>).playerId || "") : "";
        return normalized && playerId ? { ...normalized, playerId } : undefined;
      })
      .filter((entry): entry is LocalEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function queuePendingEntry(entry: LocalEntry) {
  const current = readPendingEntries();
  const previous = current.find((item) => item.playerId === entry.playerId && item.chapter === entry.chapter);
  const next = previous && compareEntries(previous, entry) <= 0
    ? current
    : [entry, ...current.filter((item) => item.playerId !== entry.playerId || item.chapter !== entry.chapter)];
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(next.slice(0, 10)));
}

async function flushPendingEntries() {
  const pending = readPendingEntries();
  if (!isOnlineLeaderboardConfigured || pending.length === 0) return pending.length;
  const remaining: LocalEntry[] = [];
  for (const entry of pending) {
    try {
      await postEntry(entry);
    } catch {
      remaining.push(entry);
    }
  }
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
  return remaining.length;
}

async function postEntry(entry: LocalEntry) {
  const response = await fetchWithTimeout(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      gameId: GAME_ID,
      playerId: entry.playerId,
      nickname: entry.nickname,
      record: {
        score: entry.score,
        stage: entry.stage,
        chapter: entry.chapter,
        grade: entry.grade,
        cleared: entry.cleared,
        elapsedMs: entry.elapsedMs
      }
    })
  });
  const payload = await response.json() as { ok?: boolean; error?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `랭킹 등록 실패: ${response.status}`);
  }
}

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry) {
  if (a.score !== b.score) return b.score - a.score;
  if (a.stage !== b.stage) return b.stage - a.stage;
  if (a.cleared !== b.cleared) return b.cleared - a.cleared;
  return a.elapsedMs - b.elapsedMs;
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6500);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
