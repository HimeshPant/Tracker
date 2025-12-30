const DB_KEYS = {
  LOGS: "protocol_logs_v5",
  CHALLENGES: "protocol_challenges_v2",
};

const DEFAULT_LOG = {
  currentPhase: "Imagine Cup Submission",
  primaryTask: "",
  primaryDone: false,
  primaryDuration: 0,
  imagineCupDone: false,
  imagineCupNote: "",
  imagineCupDuration: 0,
  mathsDone: false,
  mathsNote: "",
  mathsDuration: 0,
  dsaDone: false,
  dsaNote: "",
  dsaDuration: 0,
  customTasks: [],
  startTime: "",
  deepWork: false,
  distractionBreach: false,
  blocker: "",
  improvement: "",
};

// HELPER: Simulates network latency so the loading spinner appears
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const storageService = {
  // --- DAILY LOGS ---
  async getLog(date) {
    // FIX 1: We use 'delay' here to satisfy the linter and prevent UI flicker
    await delay(50);
    try {
      const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
      const todayLog = allLogs[date];
      return todayLog ? { ...DEFAULT_LOG, ...todayLog } : { ...DEFAULT_LOG };
    } catch (e) {
      // FIX 2: We use 'e' to log the error to console
      console.error("Failed to load logs:", e);
      return DEFAULT_LOG;
    }
  },

  async saveLog(date, data) {
    try {
      const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
      allLogs[date] = { ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(allLogs));
      return allLogs[date];
    } catch (e) {
      // FIX 2: Using 'e' again
      console.error("Failed to save log:", e);
    }
  },

  // --- HABITS / CHALLENGES ---
  async getChallenges() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.CHALLENGES) || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveChallenge(challenge) {
    const list = await this.getChallenges();
    const index = list.findIndex((c) => c.id === challenge.id);

    // Ensure history array exists
    if (!challenge.history) challenge.history = [];

    if (index >= 0) list[index] = challenge;
    else list.push(challenge);

    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },

  async deleteChallenge(id) {
    const list = await this.getChallenges();
    const newList = list.filter((c) => c.id !== id);
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(newList));
    return newList;
  },

  async toggleChallengeDate(id, dateStr) {
    const list = await this.getChallenges();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return list;

    const challenge = list[idx];
    if (!challenge.history) challenge.history = [];

    const dateIndex = challenge.history.indexOf(dateStr);

    if (dateIndex > -1) {
      // UNCHECK
      challenge.history.splice(dateIndex, 1);
    } else {
      // CHECK
      challenge.history.push(dateStr);
    }

    challenge.currentStreak = calculateStreak(challenge.history);
    challenge.lastCompletedDate = challenge.history.sort().pop() || null;

    list[idx] = challenge;
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },
};

// Helper: Calculate Streak
function calculateStreak(dates) {
  if (!dates || dates.length === 0) return 0;

  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) {
    if (sorted[0] < yesterday) return 0;
  }

  let streak = 0;
  let current = new Date(sorted[0]);

  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    const diffTime = Math.abs(current - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (i === 0) {
      streak++;
      continue;
    }

    if (diffDays <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }
  return streak;
}
