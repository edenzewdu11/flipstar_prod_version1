import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api';

const LIME = '#76C835';
const BG_DARK = '#0B0E0A';
const CARD_BG = '#131711';
const TEXT_MUTED = '#717E6B';
const TEXT_MUTED_LIGHT = '#8A9784';

const DailyStreakModal = ({ visible, onClose, onStreakClaimed }) => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);
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
    if (visible) {
      loadStreakData();
    }
  }, [visible]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.request('/gamification/status/');
      setStreakData(response);
    } catch (err) {
      console.error('Failed to load streak data:', err);
      setError('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const claimDailyBonus = async () => {
    try {
      setClaiming(true);
      try {
        await api.request('/gamification/login-bonus/', { method: 'POST' });
      } catch (checkinError) {
        await api.request('/gamification/checkin/', { method: 'POST' });
      }

      setClaimed(true);
      setStreakData(prev => ({
        ...prev,
        login_streak: {
          ...prev.login_streak,
          current: (prev.login_streak?.current || 0) + 1,
          bonus_available: false
        },
        coins: {
          ...prev.coins,
          balance: (prev.coins?.balance || 0) + (prev.login_streak?.next_bonus?.coins || 4)
        }
      }));

      if (onStreakClaimed) {
        onStreakClaimed();
      }
    } catch (err) {
      console.error('Failed to claim daily bonus:', err);
      setError(err.message || 'Failed to claim daily bonus');
    } finally {
      setClaiming(false);
    }
  };

  const currentStreak = streakData?.login_streak?.current || 0;
  const bestStreak = streakData?.login_streak?.longest || 12;
  const bonusAvailable = Boolean(streakData?.login_streak?.bonus_available) && !claimed;
  const isClaimedState = !bonusAvailable || claimed;

  const currentCycleDay = currentStreak === 0 ? 0 : ((currentStreak - 1) % 7) + 1;

  const getTotalEarned = () => {
    if (streakData?.login_streak?.total_earned != null) {
      return streakData.login_streak.total_earned;
    }
    const fullWeeks = Math.floor(currentStreak / 7);
    const remainingDays = currentStreak % 7;
    const calc = (fullWeeks * 34) + (remainingDays === 7 ? 34 : remainingDays * 4);
    return calc > 0 ? calc : '000';
  };

  const getNextMilestone = () => {
    const milestones = [8, 15, 22, 30];
    for (let milestone of milestones) {
      if (currentStreak < milestone) return milestone;
    }
    return 30;
  };

  const getMilestoneProgress = () => {
    if (currentStreak <= 0) return 4;
    if (currentStreak <= 8) {
      return Math.min(25, Math.max(6, (currentStreak / 8) * 22));
    }
    return Math.min(100, Math.max(6, (currentStreak / 30) * 100));
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
          onPress={isToday && bonusAvailable ? claimDailyBonus : undefined}
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daily rewards</Text>
            <View style={styles.headerSpacer} />
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={LIME} />
              <Text style={styles.loadingText}>Loading rewards...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Ionicons name="warning" size={32} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadStreakData}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : streakData ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* 1. Current Streak Display */}
              <View style={styles.streakCard}>
                <Text style={styles.currentStreakLabel}>Current streak</Text>
                <Text style={styles.streakDays}>{currentStreak} days</Text>
                <Text style={styles.streakInfo}>
                  Best: {bestStreak} days · Total earned: {getTotalEarned()} Coins
                </Text>
              </View>

              {/* 2. 7-Day Week Progress */}
              <View style={styles.weekCard}>
                <View style={styles.weekRow}>
                  {renderStreakDays()}
                </View>
                <Text style={styles.weekNote}>
                  Day 7 pays a bonus. Miss a day and the streak restarts.
                </Text>
              </View>

              {/* 3. Bonus Status */}
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

              {/* 4. Streak Milestones */}
              <View style={styles.milestonesCard}>
                <View style={styles.milestonesHeader}>
                  <Text style={styles.milestonesTitle}>Streak milestones</Text>
                  <Text style={styles.nextMilestoneText}>Next: Day {getNextMilestone()}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${getMilestoneProgress()}%` }]} />
                </View>
                <View style={styles.milestoneMarkers}>
                  <Text style={styles.milestoneMarker}>Day 8</Text>
                  <Text style={styles.milestoneMarker}>Day 15</Text>
                  <Text style={styles.milestoneMarker}>Day 22</Text>
                  <Text style={styles.milestoneMarker}>Day 30</Text>
                </View>
              </View>

              {/* 5. Claim Button */}
              <TouchableOpacity
                style={[
                  styles.claimButton,
                  isClaimedState ? styles.claimButtonClaimed : styles.claimButtonActive
                ]}
                onPress={claimDailyBonus}
                disabled={claiming || isClaimedState}
                activeOpacity={0.8}
              >
                {claiming ? (
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
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BG_DARK,
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    color: TEXT_MUTED_LIGHT,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: LIME,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: '#000000',
    fontWeight: '700',
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
    paddingBottom: 40,
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
});

export default DailyStreakModal;
