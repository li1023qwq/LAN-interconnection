<template>
  <div class="home">
    <div class="user-info">
      <el-tooltip content="点击更改头像" placement="bottom">
        <img :src="userStore.avatar" class="avatar" :alt="userStore.username" @click="changeAvatar">
      </el-tooltip>
      <span>{{ userStore.username }}</span>
      <el-button link @click="changeUsername">更改用户名</el-button>
    </div>

    <main class="main-content">
      <div class="hero">
        <h1 class="fade-in">局域网多功能服务器</h1>
        <p class="subtitle fade-in-delay">安全、高效的局域网通信与协作平台</p>
      </div>

      <div class="features">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>实时聊天</span>
            </div>
          </template>
          <div class="card-content">
            <p>与局域网内的其他用户进行实时文字交流</p>
            <ul>
              <li>实时消息传递</li>
              <li>在线状态显示</li>
              <li>系统通知提醒</li>
            </ul>
            <el-button type="primary" @click="$router.push('/chat')">开始聊天</el-button>
          </div>
        </el-card>

        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>文件传输</span>
            </div>
          </template>
          <div class="card-content">
            <p>快速传输和管理局域网内的文件</p>
            <ul>
              <li>支持大文件传输</li>
              <li>文件进度显示</li>
              <li>文件历史管理</li>
            </ul>
            <el-button type="primary" @click="$router.push('/files')">文件管理</el-button>
          </div>
        </el-card>

        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>屏幕共享</span>
            </div>
          </template>
          <div class="card-content">
            <p>实时共享屏幕内容给其他用户</p>
            <ul>
              <li>高清画质传输</li>
              <li>低延迟体验</li>
              <li>多人同时观看</li>
            </ul>
            <el-button type="primary" @click="$router.push('/screen')">开始共享</el-button>
          </div>
        </el-card>
      </div>

      <div class="about fade-in-up">
        <h2>关于项目</h2>
        <p>本项目是一个基于 WebSocket 和 WebRTC 技术的局域网多功能服务器，提供实时聊天、文件传输和屏幕共享等功能。所有数据传输都在局域网内完成，保证了数据传输的安全性和效率。</p>
        <h3>技术栈</h3>
        <div class="tech-stack">
          <el-tag>Vue 3</el-tag>
          <el-tag>TypeScript</el-tag>
          <el-tag>WebSocket</el-tag>
          <el-tag>WebRTC</el-tag>
          <el-tag>Spring Boot</el-tag>
          <el-tag>Element Plus</el-tag>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const userStore = useUserStore()

const changeUsername = async () => {
  try {
    const { value: newUsername } = await ElMessageBox.prompt('请输入新的用户名', '更改用户名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: '用户名长度应在1-20个字符之间'
    })
    
    if (newUsername) {
      userStore.setUsername(newUsername.trim())
    }
  } catch {
    // 用户取消操作
  }
}

const changeAvatar = () => {
  // 实现更改头像的逻辑
}
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  margin-bottom: 2rem;

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.hero {
  text-align: center;
  margin-bottom: 4rem;

  h1 {
    font-size: 2.5rem;
    color: #303133;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #606266;
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    color: #303133;
  }

  .card-content {
    p {
      margin-bottom: 1rem;
      color: #606266;
    }

    ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
      color: #606266;

      li {
        margin-bottom: 0.5rem;
      }
    }

    .el-button {
      width: 100%;
      margin-top: 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

.about {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  h2 {
    color: #303133;
    margin-bottom: 1rem;
  }

  p {
    color: #606266;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  h3 {
    color: #303133;
    margin-bottom: 1rem;
  }

  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .el-tag {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 添加动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 1s ease-out;
}

.fade-in-delay {
  animation: fadeIn 1s ease-out 0.5s both;
}

.fade-in-up {
  animation: fadeInUp 1s ease-out;
}

.avatar {
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
}
</style> 