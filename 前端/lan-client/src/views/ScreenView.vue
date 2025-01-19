<template>
  <div class="screen-share page-container">
    <!-- 头部控制区 -->
    <div class="header page-card">
      <div class="page-title">
        <el-icon><Monitor /></el-icon>
        <span>屏幕共享</span>
      </div>
      <el-button 
        v-if="!isSharing" 
        type="primary" 
        size="large"
        @click="startScreenShare"
      >
        <el-icon><VideoPlay /></el-icon>
        开始共享屏幕
      </el-button>
      <el-button 
        v-else 
        type="danger"
        size="large"
        @click="stopScreenShare"
      >
        <el-icon><VideoPause /></el-icon>
        停止共享
      </el-button>
    </div>

    <!-- 共享列表 -->
    <Transition name="fade">
      <div v-if="!isWatching && !isSharing" class="share-list page-card">
        <el-empty 
          v-if="activeShares.size === 0" 
          description="暂无共享"
          :image-size="200"
        >
          <template #description>
            <p>当前没有用户在共享屏幕</p>
            <p class="hint-text">点击右上角按钮开始共享您的屏幕</p>
          </template>
        </el-empty>
        <div v-else class="responsive-grid">
          <el-card 
            v-for="[id, share] in Array.from(activeShares)" 
            :key="id" 
            class="share-card"
            shadow="hover"
          >
            <div class="share-info">
              <div class="user-info">
                <img 
                  :src="share.avatar || userStore.generateAvatar(share.sender)" 
                  class="avatar" 
                  :alt="share.sender"
                >
                <span class="username">{{ share.sender }}</span>
                <span class="status-tag">正在共享</span>
              </div>
              <el-button 
                type="primary" 
                @click="startWatching(share.sender)"
              >
                <el-icon><VideoCamera /></el-icon>
                观看共享
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </Transition>

    <!-- 共享/观看区域 -->
    <Transition name="slide-fade">
      <div v-if="isWatching || isSharing" class="screen-area page-card">
        <div class="screen-header">
          <div class="screen-title">
            <template v-if="isSharing">
              <el-icon><VideoCamera /></el-icon>
              <span>正在共享屏幕</span>
              <span class="viewer-count">
                <el-icon><User /></el-icon>
                观看人数: {{ viewerCount }}
              </span>
            </template>
            <template v-else>
              <el-icon><Monitor /></el-icon>
              <span>正在观看 {{ currentWatching }} 的共享</span>
            </template>
          </div>
          <el-button 
            type="primary"
            plain
            @click="isWatching ? stopWatching() : stopScreenShare()"
          >
            <el-icon><Back /></el-icon>
            返回列表
          </el-button>
        </div>
        <div class="video-container">
          <video ref="screenVideo" autoplay playsinline></video>
          <div v-if="!screenVideo.srcObject" class="loading-container">
            <el-icon class="loading"><Loading /></el-icon>
            <span>正在建立连接...</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWebSocketStore } from '@/stores/websocket'
import { ElMessage } from 'element-plus'
import type { ScreenShare, IFrame } from '@/types'
import { Monitor, VideoPlay, VideoPause, VideoCamera, User, Back, Loading } from '@element-plus/icons-vue'

const userStore = useUserStore()
const wsStore = useWebSocketStore()

const isSharing = ref(false)
const viewerCount = ref(0)
const currentWatching = ref<string | null>(null)
const activeShares = ref<Map<string, ScreenShare>>(new Map())
const screenVideo = ref<HTMLVideoElement | null>(null)
const localStream = ref<MediaStream | null>(null)
const peerConnections = ref<Map<string, RTCPeerConnection>>(new Map())
const isWatching = ref(false)

// 开始屏幕共享
const startScreenShare = async () => {
  try {
    localStream.value = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    if (screenVideo.value) {
      screenVideo.value.srcObject = localStream.value
    }

    // 监听共享停止事件
    localStream.value.getVideoTracks()[0].onended = () => {
      stopScreenShare()
    }

    isSharing.value = true

    // 通知服务器开始共享
    wsStore.stompClient?.publish({
      destination: '/app/screen.start',
      body: JSON.stringify({
        sender: userStore.username,
        type: 'start',
        avatar: userStore.avatar
      })
    })

  } catch (err) {
    ElMessage.error('无法启动屏幕共享: ' + (err as Error).message)
  }
}

// 停止屏幕共享
const stopScreenShare = () => {
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }

  if (screenVideo.value) {
    screenVideo.value.srcObject = null
  }

  isSharing.value = false

  // 通知服务器停止共享
  wsStore.stompClient?.publish({
    destination: '/app/screen.stop',
    body: JSON.stringify({
      sender: userStore.username,
      type: 'stop'
    })
  })

  // 清理所有连接
  peerConnections.value.forEach(pc => pc.close())
  peerConnections.value.clear()
  viewerCount.value = 0
}

// 开始观看
const startWatching = (sharerId: string) => {
  if (currentWatching.value) {
    stopWatching()
  }

  currentWatching.value = sharerId
  isWatching.value = true

  // 发送观看请求
  wsStore.stompClient?.publish({
    destination: '/app/screen.view',
    body: JSON.stringify({
      sender: userStore.username,
      viewerId: sharerId,
      type: 'view'
    })
  })
}

// 停止观看
const stopWatching = () => {
  if (!currentWatching.value) return

  if (screenVideo.value) {
    screenVideo.value.srcObject = null
  }

  const pc = peerConnections.value.get(currentWatching.value)
  if (pc) {
    pc.close()
    peerConnections.value.delete(currentWatching.value)
  }

  currentWatching.value = null
  isWatching.value = false
}

// 处理WebRTC连接
const handleConnection = async (message: ScreenShare) => {
  switch (message.type) {
    case 'start':
      activeShares.value.set(message.sender, message)
      break

    case 'stop':
      activeShares.value.delete(message.sender)
      if (currentWatching.value === message.sender) {
        stopWatching()
      }
      break

    case 'view':
      if (isSharing.value && message.viewerId === userStore.username) {
        createPeerConnection(message.sender)
      }
      break

    case 'offer':
      if (message.viewerId === userStore.username) {
        await handleOffer(message)
      }
      break

    case 'answer':
      await handleAnswer(message)
      break

    case 'candidate':
      await handleCandidate(message)
      break
  }
}

// 创建对等连接
const createPeerConnection = async (viewerId: string) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  })

  peerConnections.value.set(viewerId, pc)
  viewerCount.value = peerConnections.value.size

  // 添加连接状态监听
  pc.onsignalingstatechange = () => {
    console.log('Signaling state change:', pc.signalingState)
  }

  pc.onconnectionstatechange = () => {
    console.log('Connection state change:', pc.connectionState)
  }

  pc.onicegatheringstatechange = () => {
    console.log('ICE gathering state:', pc.iceGatheringState)
  }

  pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', pc.iceConnectionState)
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      if (localStream.value) {
        pc.addTrack(track, localStream.value)
      }
    })
  }

  pc.onicecandidate = event => {
    if (event.candidate) {
      wsStore.stompClient?.publish({
        destination: '/app/screen.candidate',
        body: JSON.stringify({
          sender: userStore.username,
          viewerId: viewerId,
          candidate: event.candidate,
          type: 'candidate'
        })
      })
    }
  }

  try {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    wsStore.stompClient?.publish({
      destination: '/app/screen.offer',
      body: JSON.stringify({
        sender: userStore.username,
        viewerId: viewerId,
        offer: offer,
        type: 'offer'
      })
    })
  } catch (err) {
    ElMessage.error('创建连接失败: ' + (err as Error).message)
  }
}

// 处理offer
const handleOffer = async (message: ScreenShare) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  })

  peerConnections.value.set(message.sender, pc)

  // 添加连接状态监听
  pc.onsignalingstatechange = () => {
    console.log('Signaling state change:', pc.signalingState)
  }

  pc.onconnectionstatechange = () => {
    console.log('Connection state change:', pc.connectionState)
  }

  pc.onicegatheringstatechange = () => {
    console.log('ICE gathering state:', pc.iceGatheringState)
  }

  pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', pc.iceConnectionState)
  }

  pc.ontrack = event => {
    if (screenVideo.value) {
      screenVideo.value.srcObject = event.streams[0]
    }
  }

  pc.onicecandidate = event => {
    if (event.candidate) {
      wsStore.stompClient?.publish({
        destination: '/app/screen.candidate',
        body: JSON.stringify({
          sender: userStore.username,
          viewerId: message.sender,
          candidate: event.candidate,
          type: 'candidate'
        })
      })
    }
  }

  try {
    if (message.offer) {
      // 先设置远程描述
      await pc.setRemoteDescription(new RTCSessionDescription(message.offer))
      
      // 创建并设置本地描述
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // 发送应答
      wsStore.stompClient?.publish({
        destination: '/app/screen.answer',
        body: JSON.stringify({
          sender: userStore.username,
          viewerId: message.sender,
          answer: answer,
          type: 'answer'
        })
      })
    }
  } catch (err) {
    console.error('处理连接请求失败:', err)
    ElMessage.error('处理连接请求失败: ' + (err as Error).message)
  }
}

// 处理answer
const handleAnswer = async (message: ScreenShare) => {
  const pc = peerConnections.value.get(message.sender)
  if (pc && message.answer) {
    try {
      // 检查连接状态
      if (pc.signalingState === 'stable') {
        console.warn('Connection already stable, ignoring answer')
        return
      }
      
      // 确保有本地描述
      if (!pc.localDescription) {
        console.warn('No local description set, waiting...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // 设置远程描述
      await pc.setRemoteDescription(new RTCSessionDescription(message.answer))
    } catch (err) {
      console.error('处理应答失败:', err)
      ElMessage.error('处理应答失败: ' + (err as Error).message)
    }
  }
}

// 处理candidate
const handleCandidate = async (message: ScreenShare) => {
  const pc = peerConnections.value.get(message.sender)
  if (pc && message.candidate) {
    try {
      // 如果还没有设置远程描述，先缓存ICE候选
      if (pc.remoteDescription === null) {
        // 等待一段时间后再尝试添加
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate))
      } else {
        console.warn('Remote description not set, skipping ICE candidate')
      }
    } catch (err) {
      console.error('处理ICE候选失败:', err)
      ElMessage.error('处理ICE候选失败: ' + (err as Error).message)
    }
  }
}

// 订阅屏幕共享消息
onMounted(async () => {
  try {
    await wsStore.connect();
    wsStore.stompClient?.subscribe('/topic/screen', (message: IFrame) => {
      handleConnection(JSON.parse(message.body));
    });
  } catch (error) {
    ElMessage.error('连接屏幕共享服务器失败：' + (error as Error).message);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (isSharing.value) {
    stopScreenShare()
  }
  if (currentWatching.value) {
    stopWatching()
  }
})
</script>

<style scoped lang="scss">
.screen-share {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .share-list {
    flex: 1;
    overflow-y: auto;

    .share-card {
      .share-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .username {
          font-size: 1.1em;
          color: #303133;
        }
      }
    }
  }

  .screen-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .screen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .screen-title {
        font-size: 1.1em;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 10px;

        .viewer-count {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.9em;
          color: #909399;
          background: #f5f7fa;
          padding: 4px 8px;
          border-radius: 4px;
        }
      }
    }

    .video-container {
      flex: 1;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      position: relative;

      video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .loading-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;

        .loading {
          animation: rotate 1s linear infinite;
        }
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 