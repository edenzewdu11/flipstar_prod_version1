/**
 * Reward utilities for subscription-based daily login bonuses:
 * - Daily subscription: 3, 3, 3, 3... (3 coins every day)
 * - Weekly subscription: 4, 4, 4, 4, 3, 3, 3 (4 coins for Days 1-4, 3 coins for Days 5-7)
 * - Monthly subscription: 4, 4, 4, 4... (4 coins every day)
 */

export const getRewardCoinsForDay = (dayNum, durationType, customSchedule) => {
  if (customSchedule && Array.isArray(customSchedule) && customSchedule[dayNum - 1] != null) {
    return Number(customSchedule[dayNum - 1]);
  }

  const type = (durationType || '').toLowerCase();
  const day = ((dayNum - 1) % 7) + 1;

  if (type === 'daily') {
    return 3;
  }
  if (type === 'monthly') {
    return 4;
  }
  // Weekly or default fallback: 4 for first 4 days, 3 for next 3 days
  return day <= 4 ? 4 : 3;
};

export const getRewardsSchedule = (durationType) => {
  const type = (durationType || '').toLowerCase();
  if (type === 'daily') {
    return [3, 3, 3, 3, 3, 3, 3];
  }
  if (type === 'monthly') {
    return [4, 4, 4, 4, 4, 4, 4];
  }
  // Weekly / default: 4, 4, 4, 4, 3, 3, 3
  return [4, 4, 4, 4, 3, 3, 3];
};

export const getPlanRewardLabel = (durationType) => {
  const type = (durationType || '').toLowerCase();
  if (type === 'daily') {
    return 'Daily Plan • +3 Coins/day';
  }
  if (type === 'weekly') {
    return 'Weekly Plan • +4 Coins (Days 1–4), +3 Coins (Days 5–7)';
  }
  if (type === 'monthly') {
    return 'Monthly Plan • +4 Coins/day';
  }
  return 'Streak Rewards • Up to +4 Coins/day';
};

export const calculateTotalEarned = (streak, durationType) => {
  if (!streak || streak <= 0) return 0;
  const schedule = getRewardsSchedule(durationType);
  const fullCycleSum = schedule.reduce((a, b) => a + b, 0);

  const fullWeeks = Math.floor(streak / 7);
  const remainingDays = streak % 7;

  let total = fullWeeks * fullCycleSum;
  for (let i = 0; i < remainingDays; i++) {
    total += schedule[i];
  }
  return total;
};
