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
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbx-tJUJUuuFyrPNXPGDjbLGRai6QHNsNfR7bctrtmz9Hr8tE6eqGDuqqZ49ZbtzxD8bgA/exec";
const GAME_ID = "mumu-brothers";
const PLAYER_ID_KEY = "mumu-brothers-player-id-v1";
const NICKNAME_KEY = "mumu-brothers-nickname-v1";
const LOCAL_RANKING_KEY = "mumu-brothers-ranking-v1";
const TOP_LIMIT = 10;

type LocalEntry = LeaderboardEntry & { playerId: string };

export const isOnlineLeaderboardConfigured = API_URL.startsWith("https://script.google.com/");

export function getLeaderboardNickname() {
  const saved = localStorage.getItem(NICKNAME_KEY)?.trim();
  return saved ? saved.slice(0, 12) : `꿈사수-${getPlayerId().slice(0, 4).toUpperCase()}`;
}

export function saveLeaderboardNickname(value: string) {
  const nickname = sanitizeNickname(value) || getLeaderboardNickname();
  localStorage.setItem(NICKNAME_KEY, nickname);
  return nickname;
}

export async function loadLeaderboard(): Promise<LeaderboardSnapshot> {
  if (isOnlineLeaderboardConfigured) {
    try {
      const query = new URLSearchParams({
        action: "top",
        gameId: GAME_ID,
        limit: String(TOP_LIMIT)
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
        entries: payload.entries.map(normalizeEntry).filter((entry): entry is LeaderboardEntry => Boolean(entry)).slice(0, TOP_LIMIT),
        source: "online"
      };
    } catch {
      // The local board remains usable when Apps Script is unavailable.
    }
  }
  return { entries: readLocalEntries().slice(0, TOP_LIMIT), source: "local" };
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

  if (isOnlineLeaderboardConfigured) {
    try {
      const response = await fetchWithTimeout(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          gameId: GAME_ID,
          playerId: localEntry.playerId,
          nickname,
          record: {
            score: localEntry.score,
            stage: localEntry.stage,
            chapter: localEntry.chapter,
            grade: localEntry.grade,
            cleared: localEntry.cleared,
            elapsedMs: localEntry.elapsedMs
          }
        })
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `랭킹 등록 실패: ${response.status}`);
      }
      return loadLeaderboard();
    } catch {
      // The score is already preserved locally and can still be shown to the player.
    }
  }
  return { entries: readLocalEntries().slice(0, TOP_LIMIT), source: "local" };
}

function getPlayerId() {
  const saved = localStorage.getItem(PLAYER_ID_KEY);
  if (saved) return saved;
  const created = crypto.randomUUID();
  localStorage.setItem(PLAYER_ID_KEY, created);
  return created;
}

function sanitizeNickname(value: string) {
  return value
    .replace(/[<>{}[\]"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
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
  const previous = current.find((item) => item.playerId === entry.playerId);
  const next = previous && compareEntries(previous, entry) <= 0
    ? current
    : [entry, ...current.filter((item) => item.playerId !== entry.playerId)];
  localStorage.setItem(LOCAL_RANKING_KEY, JSON.stringify(next.sort(compareEntries).slice(0, 50)));
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
