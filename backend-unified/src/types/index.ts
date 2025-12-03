// 全局类型定义

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

export interface User {
  id: number;
  username: string;
  email: string;
  couple_id?: number;
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Couple {
  id: number;
  user1_id: number;
  user2_id: number;
  relationship_start_date?: Date;
  created_at: Date;
}

export interface Diary {
  id: number;
  couple_id: number;
  user_id: number;
  title?: string;
  content: string;
  mood?: string;
  images?: string;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Memory {
  id: number;
  couple_id: number;
  user_id: number;
  title: string;
  content?: string;
  memory_date?: Date;
  images?: string;
  tags?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: number;
  couple_id: number;
  sender_id: number;
  receiver_id: number;
  type: 'text' | 'image' | 'location';
  content: string;
  location_name?: string;
  is_read: boolean;
  created_at: Date;
}

export interface HeartbeatTask {
  id: number;
  task_date: Date;
  task_content: string;
  task_reward: number;
  created_at: Date;
}

export interface HeartbeatCheckin {
  id: number;
  task_id: number;
  couple_id: number;
  user_id: number;
  check_date: Date;
  task_reward: number;
  task_content: string;
  created_at: Date;
}

export interface Achievement {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  condition_type?: string;
  condition_value?: number;
  is_unlocked?: boolean;
  created_at: Date;
}

export interface MoodRecord {
  id: number;
  user_id: number;
  mood: 'very_happy' | 'happy' | 'normal' | 'sad' | 'angry';
  note?: string;
  date: Date;
  created_at: Date;
}

export interface LocationShare {
  id: number;
  user_id: number;
  couple_id: number;
  latitude: number;
  longitude: number;
  address?: string;
  created_at: Date;
}

export interface Reminder {
  id: number;
  couple_id: number;
  user_id: number;
  title: string;
  content?: string;
  remind_time: Date;
  is_completed: boolean;
  created_at: Date;
}















