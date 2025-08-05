export interface Achievement {
  id: number;
  name: string;
  description: string;
  earned: boolean;
  date?: string;
  points: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  target?: number;
  category: string;
}

export interface AchievementCategory {
  name: string;
  achievements: Achievement[];
}

export interface AchievementStats {
  totalAchievements: number;
  earnedCount: number;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
  completionRate: number;
}

export interface RecentAchievement {
  id: number;
  name: string;
  description: string;
  earned: boolean;
  date: string;
  points: number;
  icon: string;
}

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  points: number;
  level: number;
  avatar: string;
}

export interface AchievementsData {
  stats: AchievementStats;
  recentAchievements: RecentAchievement[];
  categories: AchievementCategory[];
  leaderboard: LeaderboardPlayer[];
}

export interface AchievementProgress {
  achievementId: number;
  progress: number;
  target: number;
  isCompleted: boolean;
} 