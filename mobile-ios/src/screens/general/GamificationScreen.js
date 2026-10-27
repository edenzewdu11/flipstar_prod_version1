import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api';
import { AppAlert } from '../../components/common/AppAlert';

const LIME = '#76C835';
const BG_DARK = '#0B0E0A';
const CARD_BG = '#131711';
const TEXT_MUTED = '#717E6B';
const TEXT_MUTED_LIGHT = '#8A9784';

function n(val, key) {
  if (val == null) return 0;
  if (typeof val === 'object') return val[key] ?? val.current ?? val.balance ?? 0;
  return Number(val) || 0;
}

export default function GamificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [countdown, setCountdown] = useState('11:29:05');

  // Countdown timer to next midnight reward
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight - now);
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [s, q] = await Promise.all([
        api.request('/gamification/status/').catch(() => null),
        api.request('/quests/').catch(() => []),
      ]);
      setStatus(s);
      setQuests(Array.isArray(q) ? q : q?.results || []);
    } catch (e) {
      console.log('Error loading gamification data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const claimBonus = async () => {
    if (claimingBonus) return;
    setClaimingBonus(true);
    try {
      let res;
      try {
        res = await api.request('/gamification/login-bonus/', { method: 'POST' });
      } catch (err) {
        res = await api.request('/gamification/checkin/', { method: 'POST' });
      }
      const earnedCoins = res?.coins_earned || res?.coins || (nextBonus || 4);
      AppAlert.alert('🎁 Bonus Claimed!', `You earned ${earnedCoins} coins!`);
      setJustClaimed(true);
      setStatus(prev => ({
        ...prev,
        login_streak: {
          ...prev?.login_streak,
          current: (prev?.login_streak?.current || 0) + 1,
          bonus_available: false,
        },
        coins: {
          ...prev?.coins,
          balance: (prev?.coins?.balance || 0) + earnedCoins,
        }
      }));
      loadAll(true);
    } catch (e) {
      const errorMessage = e?.message || '';
      if (errorMessage.includes('already claimed today') || errorMessage.includes('already')) {
        AppAlert.alert('⏰ Bonus Already Claimed', 'You already claimed your login bonus today. Come back tomorrow for your next bonus!');
        setJustClaimed(true);
        setStatus(prev => ({
          ...prev,
          login_streak: {
            ...prev?.login_streak,
            bonus_available: false,
          }
        }));
      } else {
        AppAlert.alert('Error', e?.message || 'Could not claim bonus.');
      }
    } finally {
      setClaimingBonus(false);
    }
  };

  const streak = n(status?.login_streak, 'current');
  const longest = n(status?.login_streak, 'longest');
  const bonusAvailable = Boolean(status?.login_streak?.bonus_available) && !justClaimed;
  const isClaimedState = !bonusAvailable || justClaimed;

  // Cycle day in 7-day week (1 to 7)
  const currentCycleDay = streak === 0 ? 0 : ((streak - 1) % 7) + 1;
  const nextBonus = status?.login_streak?.next_bonus?.coins ?? (currentCycleDay === 6 ? 10 : 4);

  // Total earned calculation
  const getTotalEarned = () => {
    if (status?.login_streak?.total_earned != null) {
      return status.login_streak.total_earned;
    }
    const fullWeeks = Math.floor(streak / 7);
    const rem = streak % 7;
    const remCoins = rem === 7 ? 34 : rem * 4;
    const calc = (fullWeeks * 34) + remCoins;
    return calc > 0 ? calc : '000';
  };

  // Next milestone calculation from [8, 15, 22, 30]
  const getNextMilestone = () => {
    const milestones = [8, 15, 22, 30];
    for (let m of milestones) {
      if (streak < m) return m;
    }
    return 30;
  };

  // Milestone Progress Bar width (matches screenshot proportions)
  const getMilestoneProgressPercent = () => {
    if (streak <= 0) return 4;
    const pct = Math.min(100, Math.max(6, (streak / 30) * 100));
    if (streak <= 8) {
      return Math.min(25, Math.max(6, (streak / 8) * 22));
    }
    return pct;
  };

  // 7-day streak tracker rendering showing exact dates and weekdays
  const renderStreakDays = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateNum = d.getDate();
      const dayName = weekdayNames[d.getDay()];
      const isToday = i === 6;

      days.push(
        <TouchableOpacity
          key={i}
          style={styles.dayCol}
          activeOpacity={isToday && bonusAvailable ? 0.7 : 1}
          onPress={isToday && bonusAvailable ? claimBonus : undefined}
        >
          {isToday ? (
            // Today's circle: dark bg, green border ring, green date number
            <View style={[styles.todayCircle, isClaimedState && styles.todayCircleClaimed]}>
              <Text style={styles.todayNumber}>{dateNum}</Text>
            </View>
          ) : (
            // Past days circle: solid white bg, slate grey date number
            <View style={styles.pastDayCircle}>
              <Text style={styles.pastDayNumber}>{dateNum}</Text>
            </View>
          )}

          {/* Weekday label below circle: 'Tue', 'Wed', etc., green for today */}
          <Text style={[styles.dayColLabel, isToday && styles.dayColLabelToday]}>
            {dayName}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={LIME} />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={LIME} />
        }
      >
        {/* 1. Current streak card */}
        <View style={styles.streakCard}>
          <Text style={styles.currentStreakLabel}>Current streak</Text>
          <Text style={styles.streakDays}>{streak} days</Text>
          <Text style={styles.streakInfo}>
            Best: {longest || 12} days · Total earned: {getTotalEarned()} Coins
          </Text>
        </View>

        {/* 2. 7-day streak week card */}
        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            {renderStreakDays()}
          </View>
          <Text style={styles.weekNote}>
            Day 7 pays a bonus. Miss a day and the streak restarts.
          </Text>
        </View>

        {/* 3. Claim status / Countdown card */}
        {isClaimedState ? (
          <View style={styles.claimedCard}>
            <Text style={styles.claimedTitle}>✓ Bonus claimed today</Text>
            <Text style={styles.nextRewardLabel}>Next reward in</Text>
            <Text style={styles.timerText}>{countdown || '11:29:05'}</Text>
          </View>
        ) : (
          <View style={styles.claimedCard}>
            <Text style={styles.claimedTitle}>🎁 Bonus available today</Text>
            <Text style={styles.nextRewardLabel}>Next reward in</Text>
            <Text style={styles.timerText}>{countdown || '11:29:05'}</Text>
          </View>
        )}

        {/* 4. Streak milestones card */}
        <View style={styles.milestonesCard}>
          <View style={styles.milestonesHeader}>
            <Text style={styles.milestonesTitle}>Streak milestones</Text>
            <Text style={styles.nextMilestoneText}>Next: Day {getNextMilestone()}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getMilestoneProgressPercent()}%` }]} />
          </View>
          <View style={styles.milestoneMarkers}>
            <Text style={styles.milestoneMarker}>Day 8</Text>
            <Text style={styles.milestoneMarker}>Day 15</Text>
            <Text style={styles.milestoneMarker}>Day 22</Text>
            <Text style={styles.milestoneMarker}>Day 30</Text>
          </View>
        </View>

        {/* 5. Bottom action button */}
        <TouchableOpacity
          style={[
            styles.claimButton,
            isClaimedState ? styles.claimButtonClaimed : styles.claimButtonActive
          ]}
          onPress={claimBonus}
          disabled={claimingBonus || isClaimedState}
          activeOpacity={0.8}
        >
          {claimingBonus ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={[
              styles.claimButtonText,
              isClaimedState && styles.claimButtonTextClaimed
            ]}>
              {isClaimedState ? 'Claimed' : 'Claim'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Optional Daily Quests (Scrollable below main cards) */}
        {quests && quests.length > 0 && (
          <View style={styles.questsSection}>
            <View style={styles.questsHeader}>
              <Text style={styles.questsTitle}>Daily Quests</Text>
              <View style={styles.questsCountBadge}>
                <Text style={styles.questsCountText}>{quests.length}</Text>
              </View>
            </View>
            {quests.map((q) => (
              <View key={q.id || q.title} style={styles.questCard}>
                <View style={styles.questCheckIcon}>
                  <Ionicons name="checkmark" size={14} color="#000" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.questCardTitle}>{q.title || q.name}</Text>
                  {q.description ? (
                    <Text style={styles.questCardDesc}>{q.description}</Text>
                  ) : null}
                </View>
                <View style={styles.questRewardBadge}>
                  <Text style={styles.questRewardText}>+{q.reward_coins || q.coins || 0} Coins</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: TEXT_MUTED_LIGHT,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  // Card 1: Current Streak
  streakCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  currentStreakLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  streakDays: {
    fontSize: 54,
    fontWeight: '900',
    color: LIME,
    letterSpacing: -1,
    marginBottom: 6,
  },
  streakInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  // Card 2: 7-Day Weekly Row
  weekCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  pastDayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  pastDayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B8794',
  },
  todayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#11160F',
    borderWidth: 2,
    borderColor: LIME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircleClaimed: {
    backgroundColor: 'rgba(118, 200, 53, 0.12)',
  },
  todayNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: LIME,
  },
  dayColLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8A9784',
    marginTop: 8,
    textAlign: 'center',
  },
  dayColLabelToday: {
    color: LIME,
    fontWeight: '800',
  },
  weekNote: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Card 3: Bonus Claim / Timer Card
  claimedCard: {
    backgroundColor: '#131A0F',
    borderWidth: 1.5,
    borderColor: LIME,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  claimedTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: LIME,
    marginBottom: 6,
    textAlign: 'center',
  },
  nextRewardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginBottom: 6,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  // Card 4: Streak Milestones
  milestonesCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  milestonesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextMilestoneText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#262D21',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LIME,
    borderRadius: 4,
  },
  milestoneMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneMarker: {
    fontSize: 12.5,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  // Card 5: Bottom Button
  claimButton: {
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  claimButtonActive: {
    backgroundColor: LIME,
  },
  claimButtonClaimed: {
    backgroundColor: '#476326',
  },
  claimButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },
  claimButtonTextClaimed: {
    color: '#0D1409',
  },
  // Quests
  questsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  questsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  questsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questsCountBadge: {
    backgroundColor: '#1E2519',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  questsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: LIME,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  questCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  questCardDesc: {
    fontSize: 12,
    color: TEXT_MUTED_LIGHT,
  },
  questRewardBadge: {
    backgroundColor: '#1E2519',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  questRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: LIME,
  },
});
