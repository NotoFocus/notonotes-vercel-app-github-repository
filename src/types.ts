export type Priority = 'Tinggi' | 'Sedang' | 'Rendah';

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
}

export interface Task {
  id: string;
  title: string;
  time: string;
  date: string; // 'Hari ini', 'Besok', etc or ISO date
  priority: Priority;
  completed: boolean;
  pinned?: boolean;
}
