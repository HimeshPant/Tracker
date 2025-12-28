const DB_KEYS = {
  LOGS: "exec_logs_v1",
  CHALLENGES: "exec_challenges_v1",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const storageService = {
  // --- DAILY LOGS ---
  async getLog(date) {
    await delay(50); // Simulate network
    const logs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
    return logs[date] || null;
  },

  async saveLog(date, data) {
    await delay(100);
    const logs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
    logs[date] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
    return logs[date];
  },

  // --- CHALLENGES ---
  async getChallenges() {
    await delay(50);
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

    // Toggle Logic
    if (challenge.lastCompletedDate === date) {
      // Undo
      challenge.currentStreak = Math.max(0, challenge.currentStreak - 1);
      challenge.lastCompletedDate = null;
    } else {
      // Complete
      challenge.currentStreak = (challenge.currentStreak || 0) + 1;
      challenge.lastCompletedDate = date;
    }

    list[idx] = challenge;
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },
};
