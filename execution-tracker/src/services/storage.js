const DB_KEYS = {
  LOGS: "protocol_logs_v4", // v4 for Custom Tasks
  CHALLENGES: "protocol_challenges_v1",
};

const DEFAULT_LOG = {
  // 1. PRIMARY (Variable)
  currentPhase: "Imagine Cup Submission",
  primaryTask: "",
  primaryDone: false,
  primaryDuration: 0,

  // 2. CORE FIXED BLOCKS
  imagineCupDone: false,
  imagineCupNote: "",
  imagineCupDuration: 0,

  mathsDone: false,
  mathsNote: "",
  mathsDuration: 0,

  dsaDone: false,
  dsaNote: "",
  dsaDuration: 0,

  // 3. CUSTOM TASKS (NEW)
  customTasks: [], // Array of { id, text, isDone }

  // 4. HEALTH
  startTime: "",
  deepWork: false,
  distractionBreach: false,

  // 5. REFLECTION
  blocker: "",
  improvement: "",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const storageService = {
  async getLog(date) {
    await delay(50);
    const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
    const todayLog = allLogs[date];
    // Merge defaults to handle new fields on old logs
    return todayLog ? { ...DEFAULT_LOG, ...todayLog } : { ...DEFAULT_LOG };
  },

  async saveLog(date, data) {
    const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
    allLogs[date] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(allLogs));
    return allLogs[date];
  },

  async getChallenges() {
    return JSON.parse(localStorage.getItem(DB_KEYS.CHALLENGES) || "[]");
  },

  async saveChallenge(challenge) {
    const list = await this.getChallenges();
    const index = list.findIndex((c) => c.id === challenge.id);
    if (index >= 0) list[index] = challenge;
    else list.push(challenge);
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },

  async toggleChallengeStreak(id, date) {
    const list = await this.getChallenges();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return list;
    const challenge = list[idx];

    if (challenge.lastCompletedDate === date) {
      challenge.currentStreak = Math.max(0, challenge.currentStreak - 1);
      challenge.lastCompletedDate = null;
    } else {
      challenge.currentStreak = (challenge.currentStreak || 0) + 1;
      challenge.lastCompletedDate = date;
    }
    list[idx] = challenge;
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },
};
