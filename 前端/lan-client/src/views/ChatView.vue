<template>
  <div class="chat">
    <div class="message-area" ref="messageArea">
      <div v-for="(message, index) in messages" :key="index">
        <div v-if="message.type !== 'CHAT'" class="system-message">
          <div class="system-message-content">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ getSystemMessage(message) }}</span>
          </div>
          <div class="system-message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <div v-else
          :class="['message-container', message.sender === userStore.username ? 'sent' : 'received']"
        >
          <img :src="message.avatar || userStore.generateAvatar(message.sender)" class="avatar" :alt="message.sender">
          <div class="message">
            <div class="message-sender">{{ message.sender }}</div>
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="input-area">
      <el-input
        v-model="messageInput"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button @click="sendMessage">发送</el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWebSocketStore } from '@/stores/websocket'
import type { ChatMessage, IFrame } from '@/types'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

const userStore = useUserStore()
const wsStore = useWebSocketStore()
const messageInput = ref('')
const messages = ref<ChatMessage[]>([])
const messageArea = ref<HTMLElement | null>(null)

// 生成系统消息文本
const getSystemMessage = (message: ChatMessage): string => {
  switch (message.type) {
    case 'JOIN':
      return `${message.sender} 加入了聊天室`
    case 'LEAVE':
      return `${message.sender} 离开了聊天室`
    case 'RENAME':
      return `${message.oldUsername} 改名为 ${message.sender}`
    default:
      return ''
  }
}

// 发送消息
const sendMessage = () => {
  const content = messageInput.value.trim()
  if (!content || !wsStore.connected) return

  wsStore.stompClient?.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({
      sender: userStore.username,
      content,
      type: 'CHAT',
      avatar: userStore.avatar,
      timestamp: Date.now()
    })
  })

  messageInput.value = ''
}

// 处理收到的消息
const handleMessage = (message: ChatMessage) => {
  messages.value.push(message)
  nextTick(() => {
    if (messageArea.value) {
      messageArea.value.scrollTop = messageArea.value.scrollHeight
    }
  })
}

// 组件挂载时订阅消息
onMounted(async () => {
  try {
    await wsStore.connect();
    wsStore.stompClient?.subscribe('/topic/public', (message: IFrame) => {
      handleMessage(JSON.parse(message.body));
    });
  } catch (error) {
    ElMessage.error('连接聊天服务器失败：' + (error as Error).message);
  }
});

// 组件卸载时断开连接
onUnmounted(() => {
  wsStore.disconnect()
})

// 添加时间格式化函数
const formatTime = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped lang="scss">
.chat {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f7fa;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.system-message {
  text-align: center;
  margin: 20px 0;
  
  .system-message-content {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(64, 158, 255, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    color: #409EFF;
    font-size: 0.9rem;
    
    .el-icon {
      font-size: 1.1rem;
    }
  }
  
  .system-message-time {
    font-size: 0.8rem;
    color: #909399;
    margin-top: 4px;
  }
}

.message-container {
  display: flex;
  align-items: flex-start;
  margin: 15px 0;
  position: relative;

  &.sent {
    flex-direction: row-reverse;

    .message {
      margin-right: 10px;
      margin-left: 0;
      background: #95ec69;

      &::before {
        right: -8px;
        left: auto;
        border-left-color: #95ec69;
        border-right-color: transparent;
      }

      .message-time {
        text-align: left;
      }
    }
  }

  &.received .message {
    background: white;
    margin-left: 10px;

    &::before {
      left: -8px;
      border-right-color: white;
      border-left-color: transparent;
    }

    .message-time {
      text-align: right;
    }
  }
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message {
  position: relative;
  padding: 10px 15px;
  border-radius: 8px;
  max-width: 60%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);

  &::before {
    content: '';
    position: absolute;
    top: 10px;
    border-style: solid;
    border-width: 8px;
  }

  .message-sender {
    font-size: 0.8em;
    color: #666;
    margin-bottom: 4px;
  }

  .message-content {
    color: #303133;
    line-height: 1.4;
    word-break: break-word;
  }

  .message-time {
    font-size: 0.75em;
    color: #909399;
    margin-top: 4px;
  }
}

.input-area {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
</style> 