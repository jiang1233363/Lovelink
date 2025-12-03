# LoveLink 前端 (Vue 3 + Vite)

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
npm run dev
```
访问 http://localhost:8080

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
frontend-vue3/
├── src/
│   ├── api/
│   │   └── http.js          # HTTP请求封装
│   ├── pages/
│   │   ├── Login.vue        # 登录页
│   │   ├── Home.vue         # 首页
│   │   ├── Mood.vue         # 心情模块
│   │   ├── Diary.vue        # 日记模块
│   │   ├── Reminder.vue     # 提醒模块
│   │   ├── AccountBook.vue  # 账本模块
│   │   └── Memory.vue       # 回忆模块
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 功能模块

### 1. 登录模块
- 用户名/密码登录
- Token存储
- 自动跳转

### 2. 心情记录
- ✅ 创建心情
- ✅ 查看心情列表
- ✅ 删除心情

### 3. 共享日记
- ✅ 创建日记
- ✅ 编辑日记
- ✅ 查看日记列表
- ✅ 删除日记

### 4. 提醒事项
- ✅ 创建提醒
- ✅ 切换完成状态
- ✅ 删除提醒

### 5. 共同账本
- ✅ 创建记账记录
- ✅ 编辑记录
- ✅ 分类管理
- ✅ 删除记录

### 6. 美好回忆
- ✅ 创建回忆
- ✅ 编辑回忆
- ✅ 类型分类
- ✅ 删除回忆

## 测试

所有按钮和输入框都有明确的class，方便Puppeteer测试：
- `.username-input` - 用户名输入
- `.password-input` - 密码输入
- `.login-btn` - 登录按钮
- `.save-mood-btn` - 保存心情按钮
- `.add-diary-btn` - 新建日记按钮
- 等等...

## API 接口

后端地址：`http://localhost:3000/api`

所有请求自动携带 Authorization Token。




