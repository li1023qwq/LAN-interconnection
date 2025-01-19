<template>
  <el-container class="layout">
    <el-header>
      <nav class="nav">
        <router-link to="/" class="logo">
          <el-icon><Monitor /></el-icon>
          局域网多功能服务器
        </router-link>
        <div class="nav-links">
          <router-link to="/">
            <el-icon><HomeFilled /></el-icon>
            首页
          </router-link>
          <router-link to="/chat">
            <el-icon><ChatDotRound /></el-icon>
            实时聊天
          </router-link>
          <router-link to="/files">
            <el-icon><Document /></el-icon>
            文件传输
          </router-link>
          <router-link to="/screen">
            <el-icon><VideoCamera /></el-icon>
            屏幕共享
          </router-link>
        </div>
      </nav>
    </el-header>

    <el-main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, ChatDotRound, Document, VideoCamera, Monitor } from '@element-plus/icons-vue'

const route = useRoute()

// 动态更新标题
watch(() => route.name, (newName) => {
  let title = '晚夜深秋局域网多功能服务器'
  switch (newName) {
    case 'chat':
      title = '实时聊天 - ' + title
      break
    case 'files':
      title = '文件传输 - ' + title
      break
    case 'screen':
      title = '屏幕共享 - ' + title
      break
  }
  document.title = title
}, { immediate: true })
</script>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
}

.el-header {
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;

  .logo {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--el-color-primary);
    text-decoration: none;
    margin-right: 40px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    .el-icon {
      font-size: 1.4em;
    }
  }

  .nav-links {
    display: flex;
    gap: 20px;

    a {
      color: #606266;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 20px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 6px;

      .el-icon {
        font-size: 1.2em;
      }

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        transform: translateY(-2px);
      }

      &.router-link-active {
        color: white;
        background: var(--el-color-primary);

        &:hover {
          transform: none;
          opacity: 0.9;
        }
      }
    }
  }
}

.el-main {
  padding: 0;
  background: #f5f7fa;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
