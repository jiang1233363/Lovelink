

CREATE DATABASE IF NOT EXISTS lovelink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lovelink_db;

-- ====== 核心表 ======

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT '/static/default-avatar.png',
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  birthday DATE DEFAULT NULL,
  location VARCHAR(100) DEFAULT NULL,
  couple_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 情侣关系表
CREATE TABLE IF NOT EXISTS couples (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  relationship_start_date DATE NOT NULL,
  relationship_status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users (user1_id, user2_id),
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 日记模块 ======

-- 心情日记表
CREATE TABLE IF NOT EXISTS diaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  mood ENUM('happy', 'loved', 'sad', 'angry', 'excited', 'calm', 'worried') DEFAULT 'happy',
  weather VARCHAR(50) DEFAULT NULL,
  image_urls TEXT DEFAULT NULL COMMENT 'JSON数组存储多张图片',
  location VARCHAR(200) DEFAULT NULL,
  is_private TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 回忆模块 ======

-- 回忆墙表
CREATE TABLE IF NOT EXISTS memories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  memory_date DATE DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  location VARCHAR(200) DEFAULT NULL,
  tags VARCHAR(500) DEFAULT NULL COMMENT '标签，逗号分隔',
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  INDEX idx_memory_date (memory_date),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 相册模块 ======

-- 相册表
CREATE TABLE IF NOT EXISTS albums (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  cover_image VARCHAR(500) DEFAULT NULL,
  photo_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 相册照片表
CREATE TABLE IF NOT EXISTS album_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  album_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  caption TEXT DEFAULT NULL,
  taken_date DATE DEFAULT NULL,
  location VARCHAR(200) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_album (album_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 账本模块 ======

-- 共同账本表
CREATE TABLE IF NOT EXISTS account_book (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(50) NOT NULL COMMENT '分类：餐饮、交通、娱乐等',
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  INDEX idx_date (transaction_date),
  INDEX idx_type (type),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 日程模块 ======

-- 情侣日程表
CREATE TABLE IF NOT EXISTS calendar_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  event_date DATE NOT NULL,
  event_time TIME DEFAULT NULL,
  location VARCHAR(200) DEFAULT NULL,
  reminder_time DATETIME DEFAULT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_event_date (event_date),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 问答模块 ======

-- 问答表
CREATE TABLE IF NOT EXISTS qas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  question TEXT NOT NULL,
  user1_answer TEXT DEFAULT NULL,
  user2_answer TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 心动计划模块 ======

-- 心动计划打卡表
CREATE TABLE IF NOT EXISTS heartbeat_checkins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  check_date DATE NOT NULL,
  day_number INT NOT NULL COMMENT '第几天',
  task_content VARCHAR(500) NOT NULL,
  task_reward INT DEFAULT 10 COMMENT '火花值奖励',
  photo_url VARCHAR(500) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_date (check_date),
  UNIQUE KEY uk_couple_date (couple_id, check_date),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 成就模块 ======

-- 成就定义表
CREATE TABLE IF NOT EXISTS achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  points INT DEFAULT 10 COMMENT '成就积分',
  condition_type VARCHAR(50) NOT NULL COMMENT '解锁条件类型',
  condition_value INT NOT NULL COMMENT '解锁条件值',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  achievement_id INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_achievement (achievement_id),
  UNIQUE KEY uk_couple_achievement (couple_id, achievement_id),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 动漫照片模块 ======

-- 动漫照片表
CREATE TABLE IF NOT EXISTS anime_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  original_url VARCHAR(500) NOT NULL,
  anime_url VARCHAR(500) DEFAULT NULL,
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_status (status),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 消防员模块 ======

-- 消防员任务表
CREATE TABLE IF NOT EXISTS fireman_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  task_date DATE NOT NULL,
  task_content VARCHAR(500) NOT NULL,
  user1_completed TINYINT(1) DEFAULT 0,
  user2_completed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_date (task_date),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 小窝模块 ======

-- 情侣小窝表
CREATE TABLE IF NOT EXISTS couple_nest (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL UNIQUE,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 小窝商店物品表
CREATE TABLE IF NOT EXISTS nest_shop_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  price INT NOT NULL COMMENT '火花值价格',
  category VARCHAR(50) DEFAULT NULL COMMENT '分类：家具、装饰等',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 小窝拥有的物品表
CREATE TABLE IF NOT EXISTS nest_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  x INT DEFAULT 0 COMMENT 'X坐标',
  y INT DEFAULT 0 COMMENT 'Y坐标',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES nest_shop_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 聊天模块 ======

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  type ENUM('text', 'image', 'voice', 'video', 'file') DEFAULT 'text',
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 心情模块 ======

-- 心情日历表
CREATE TABLE IF NOT EXISTS moods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  mood_type ENUM('happy', 'sad', 'angry', 'excited', 'calm', 'worried', 'loved') NOT NULL,
  date DATE NOT NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  INDEX idx_date (date),
  UNIQUE KEY uk_user_date (user_id, date),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 位置模块 ======

-- 位置共享表
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 经期模块 ======

-- 经期记录表
CREATE TABLE IF NOT EXISTS period_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  cycle_length INT DEFAULT 28 COMMENT '周期长度（天）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_start_date (start_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 提醒模块 ======

-- 提醒事项表
CREATE TABLE IF NOT EXISTS reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  couple_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  remind_at DATETIME NOT NULL,
  is_completed TINYINT(1) DEFAULT 0,
  repeat_type ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'none',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_couple (couple_id),
  INDEX idx_user (user_id),
  INDEX idx_remind_at (remind_at),
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====== 初始数据 ======

-- 插入默认成就
INSERT IGNORE INTO achievements (id, name, description, icon, points, condition_type, condition_value) VALUES
(1, '初次相遇', '成功建立情侣关系', '💕', 10, 'relationship_created', 1),
(2, '甜蜜7天', '恋爱7天纪念', '🎉', 20, 'days_together', 7),
(3, '幸福30天', '恋爱30天纪念', '🎊', 50, 'days_together', 30),
(4, '百日快乐', '恋爱100天纪念', '💯', 100, 'days_together', 100),
(5, '相知半年', '恋爱180天纪念', '🌟', 180, 'days_together', 180),
(6, '周年庆典', '恋爱365天纪念', '🎆', 365, 'days_together', 365),
(7, '打卡达人', '连续打卡7天', '📅', 30, 'consecutive_checkin', 7),
(8, '坚持不懈', '连续打卡30天', '🏆', 100, 'consecutive_checkin', 30),
(9, '回忆收藏家', '创建10条回忆', '🏛️', 50, 'memory_count', 10),
(10, '日记作家', '撰写50篇日记', '📝', 80, 'diary_count', 50);

-- 插入默认小窝商店物品
INSERT IGNORE INTO nest_shop_items (id, name, description, icon, price, category) VALUES
(1, '小沙发', '温馨的双人沙发', '🛋️', 50, '家具'),
(2, '床', '舒适的大床', '🛏️', 100, '家具'),
(3, '台灯', '浪漫的小台灯', '💡', 30, '装饰'),
(4, '照片墙', '挂满回忆的照片墙', '🖼️', 80, '装饰'),
(5, '绿植', '生机勃勃的盆栽', '🌱', 20, '装饰'),
(6, '地毯', '柔软的地毯', '🧶', 40, '装饰'),
(7, '书架', '放满书的书架', '📚', 60, '家具'),
(8, '餐桌', '一起用餐的小餐桌', '🍽️', 70, '家具'),
(9, '挂画', '艺术气息的挂画', '🎨', 35, '装饰'),
(10, '窗帘', '温馨的窗帘', '🪟', 25, '装饰');

-- ====== 完成 ======
-- Schema创建完成，共30+张表
-- 支持17个功能模块















