<div align="center">
  <img src="https://wp.li1023.com/wp-content/uploads/2025/01/1737201650-logo.png" alt="晚夜深秋" width="200" height="200">
  
  # 🌐 局域网多功能服务器
  
  _✨ 由晚夜深秋开发维护 ✨_
  
  [官网](https://www.li1023.com) · 
</div>

---

一个基于 Spring Boot 和 Vue 3 的局域网多功能服务器，提供实时聊天、文件传输和屏幕共享等功能。

[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.x-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 功能特性

### 💬 实时聊天
- 支持群聊消息
- 在线状态显示
- 系统通知提醒
- 用户名和头像自定义

### 📂 文件传输
- 支持大文件上传
- 文件进度显示
- 文件历史管理
- 支持多文件同时上传

### 🖥️ 屏幕共享
- 实时屏幕分享
- 多人同时观看
- 支持音频传输
- 低延迟传输

## 🛠️ 技术栈

### 🎨 前端
```
Vue 3
TypeScript
Pinia
Vue Router
Element Plus
WebSocket (STOMP)
WebRTC
SCSS
```

### 💻 后端
```
Spring Boot
WebSocket
Java 17
Lombok
Maven
```

## 📁 项目结构

```
├── 前端
│   └── lan-client                # Vue 3 前端项目
│       ├── public                # 静态公共资源
│       ├── src
│       │   ├── assets           # 静态资源
│       │   ├── components       # 公共组件
│       │   ├── router           # 路由配置
│       │   ├── stores           # Pinia 状态管理
│       │   ├── types            # TypeScript 类型定义
│       │   └── views            # 页面组件
│       └── package.json         # 项目依赖配置
└── 后端
    ├── src
    │   └── main
    │       ├── java
    │       │   └── com.example.lanserver
    │       │       ├── config        # 配置类
    │       │       ├── controller    # 控制器
    │       │       └── model         # 数据模型
    │       └── resources
    │           ├── static            # 静态资源
    │           └── application.properties  # 应用配置
    └── pom.xml                       # Maven 配置
```

## 🚀 开发指南

### 环境要求

```
🔧 Node.js >= 16
☕ Java >= 17
🛠️ Maven >= 3.6
```

### 前端开发

```bash
# 进入前端目录
cd 前端/lan-client

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

```bash
# 使用 Maven 构建
mvn clean install

# 运行 Spring Boot 应用
mvn spring-boot:run
```

## 📝 功能说明

### 💭 实时聊天
- 基于 WebSocket 的实时通信
- 支持系统消息（加入、离开、改名）
- 自动生成用户头像
- 消息时间显示

### 📤 文件传输
- 支持文件上传和下载
- 显示上传进度
- 文件大小限制：100MB
- 支持文件删除和管理

### 🎥 屏幕共享
- 基于 WebRTC 的实时屏幕共享
- 支持多人观看
- 显示观看人数
- 支持音频传输

## 🌐 浏览器支持

```
Chrome >= 87
Firefox >= 78
Safari >= 14
Edge >= 88
```

## ⚠️ 注意事项

1. 所有功能仅在局域网内可用
2. 屏幕共享需要浏览器支持 WebRTC
3. 建议使用最新版本的 Chrome 浏览器
4. 文件上传大小默认限制为 100MB

## 📋 开发计划

- [ ] 添加私聊功能
- [ ] 支持消息撤回
- [ ] 添加文件预览
- [ ] 优化屏幕共享质量
- [ ] 添加用户权限管理

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 📮 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
