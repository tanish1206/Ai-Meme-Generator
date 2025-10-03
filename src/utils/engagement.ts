export interface EngagementState {
  totalCreated: number;
  currentStreakDays: number;
  lastCreatedISO: string | null;
  badges: string[];
}

const STORAGE_KEY = 'memegen_engagement_v1';

export function getEngagement(): EngagementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EngagementState;
  } catch {}
  return { totalCreated: 0, currentStreakDays: 0, lastCreatedISO: null, badges: [] };
}

export function recordMemeCreated(): EngagementState {
  const prev = getEngagement();
  const now = new Date();
  let streak = prev.currentStreakDays || 0;

  if (prev.lastCreatedISO) {
    const last = new Date(prev.lastCreatedISO);
    const diffDays = Math.floor((toMidnight(now).getTime() - toMidnight(last).getTime()) / 86400000);
    if (diffDays === 0) {
      // same day, streak unchanged
    } else if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  const total = (prev.totalCreated || 0) + 1;
  const badges = computeBadges(total, streak, prev.badges || []);
  const next: EngagementState = {
    totalCreated: total,
    currentStreakDays: streak,
    lastCreatedISO: now.toISOString(),
    badges
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function toMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function computeBadges(total: number, streak: number, existing: string[] = []): string[] {
  const set = new Set(existing);
  if (streak >= 5) set.add('Made memes 5 days in a row!');
  if (streak >= 10) set.add('Streak Master 🔥');
  if (total >= 10) set.add('Certified Dank Lord 🌌');
  if (total >= 50) set.add('Meme Machine ⚙️');
  return Array.from(set);
}


