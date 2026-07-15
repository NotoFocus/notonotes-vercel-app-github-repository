export type Priority = 'Tinggi' | 'Sedang' | 'Rendah';

export type Mood = 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | null;

export interface MoodEntry {
  date: string; // ISO date YYYY-MM-DD
  mood: Mood;
  note?: string;
}

export interface User {
  name: string;
  avatarUrl: string;
}

export interface Note {
  id: string;
  title: string;
  date: string; // ISO or formatted string for dummy
  tags: string[];
  thumbnailUrl?: string;
  content: string;
  pinned?: boolean;
  isArchived?: boolean;
  reminder?: string; // ISO datetime string: YYYY-MM-DDTHH:mm
}

export interface DisciplineData {
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  after1MonthPhotoUrl?: string;
  after6MonthsPhotoUrl?: string;
  after1YearPhotoUrl?: string;
  startDate?: string;
  targetDate?: string;
  motivation?: string;
  reward?: string;
  punishment?: string;
  dailyCheckins?: string[];
  usedRestDates?: string[];
  milestones?: { id: string; title: string; completed: boolean }[];
  journeyLog?: { id: string; date: string; content: string }[];
  punishmentCompletedDates?: string[];
}

export interface Task {
  id: string;
  title: string;
  time: string;
  date: string; // 'Hari ini', 'Besok', etc or ISO date
  createdAt?: string;
  priority: Priority;
  completed: boolean;
  pinned?: boolean;
  repeat?: 'once' | 'daily';
  alarmTime?: string;
  completedDates?: string[];
  isDiscipline?: boolean;
  disciplineData?: DisciplineData;
  deleted?: boolean;
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  currency?: 'IDR' | 'USD';
}

export interface PinHistoryEntry {
  id: string;
  hashedPin: string;
  startDate: string; // ISO date string or formatted date
  endDate: string | null; // ISO date string or null if currently active
}
