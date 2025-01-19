<template>
  <div class="files">
    <div class="file-upload-area">
      <el-upload
        multiple
        :http-request="uploadFile"
        :before-upload="beforeUpload"
        :on-progress="onProgress"
        :show-file-list="false"
      >
        <el-button type="primary">选择文件</el-button>
      </el-upload>
      
      <div v-if="uploadProgress > 0" class="progress-bar">
        <el-progress :percentage="uploadProgress" />
      </div>
    </div>

    <div class="file-list">
      <el-table :data="files" style="width: 100%">
        <el-table-column prop="name" label="文件名" />
        <el-table-column prop="size" label="大小" :formatter="formatSize" />
        <el-table-column prop="lastModified" label="上传时间" :formatter="formatDate" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button @click="downloadFile(scope.row)" type="primary" size="small">
              下载
            </el-button>
            <el-button @click="deleteFile(scope.row)" type="danger" size="small">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FileInfo } from '@/types'
import type { UploadRequestOptions } from 'element-plus'

const files = ref<FileInfo[]>([])
const uploadProgress = ref(0)

// 格式化文件大小
const formatSize = (row: FileInfo) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  let size = row.size
  let i = 0
  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${sizes[i]}`
}

// 格式化日期
const formatDate = (row: FileInfo) => {
  return new Date(row.lastModified).toLocaleString()
}

// 上传前检查
const beforeUpload = (file: File) => {
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 超过100MB限制`)
    return false
  }
  return true
}

// 上传进度
const onProgress = (event: ProgressEvent, uploadFile: any) => {
  if (event.lengthComputable) {
    uploadProgress.value = Math.round((event.loaded / event.total) * 100)
  }
}

// 上传文件
const uploadFile = async (options: UploadRequestOptions) => {
  const formData = new FormData()
  formData.append('files', options.file)
  
  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) throw new Error('上传失败')
    
    ElMessage.success('上传成功')
    await updateFileList()
  } catch (error) {
    ElMessage.error('上传失败: ' + (error as Error).message)
  } finally {
    uploadProgress.value = 0
  }
}

// 下载文件
const downloadFile = (file: FileInfo) => {
  window.location.href = `/api/files/download/${file.name}`
}

// 删除文件
const deleteFile = async (file: FileInfo) => {
  try {
    const response = await fetch(`/api/files/delete/${file.name}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('删除失败')
    
    ElMessage.success('删除成功')
    await updateFileList()
  } catch (error) {
    ElMessage.error('删除失败: ' + (error as Error).message)
  }
}

// 更新文件列表
const updateFileList = async () => {
  try {
    const response = await fetch('/api/files/list')
    files.value = await response.json()
  } catch (error) {
    ElMessage.error('获取文件列表失败')
  }
}

onMounted(() => {
  updateFileList()
})
</script>

<style scoped lang="scss">
.files {
  padding: 20px;
  
  .file-upload-area {
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    
    .progress-bar {
      margin-top: 20px;
    }
  }
  
  .file-list {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  }
}
</style> 