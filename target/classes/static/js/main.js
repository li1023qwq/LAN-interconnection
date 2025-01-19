let stompClient = null;
let username = null;
let userAvatar = null;

function generateAvatar(username) {
    // 使用用户名生成随机颜色的头像
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    const color = colors[Math.floor(username.length % colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${color.substring(1)}&color=fff`;
}

function updateUsernameDisplay() {
    const usernameElement = document.getElementById('currentUsername');
    const avatarImg = document.createElement('img');
    avatarImg.src = userAvatar;
    avatarImg.classList.add('avatar');
    
    usernameElement.innerHTML = '';
    usernameElement.appendChild(avatarImg);
    usernameElement.appendChild(document.createTextNode(`当前用户：${username}`));
}

function changeUsername() {
    const newUsername = prompt("请输入新的用户名：");
    if (newUsername && newUsername.trim()) {
        const oldUsername = username;
        username = newUsername.trim();
        
        // 发送改名消息
        if (stompClient) {
            stompClient.send("/app/chat.rename",
                {},
                JSON.stringify({
                    sender: username,
                    oldUsername: oldUsername,
                    type: 'RENAME'
                })
            );
        }
        
        // 更新本地存储和显示
        localStorage.setItem('username', username);
        userAvatar = generateAvatar(username);
        updateUsernameDisplay();
    }
}

function connect() {
    username = localStorage.getItem('username');
    if (!username) {
        username = prompt("请输入您的用户名：", "用户" + Math.floor(Math.random() * 1000));
        if (!username) {
            username = "用户" + Math.floor(Math.random() * 1000);
        }
        localStorage.setItem('username', username);
    }
    
    userAvatar = generateAvatar(username);
    updateUsernameDisplay();

    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);
        
        // 订阅公共聊天室
        stompClient.subscribe('/topic/public', function(message) {
            showMessage(JSON.parse(message.body));
        });
        
        // 订阅屏幕共享消息
        stompClient.subscribe('/topic/screen', function(message) {
            handleScreenMessage(JSON.parse(message.body));
        });
        
        // 发送加入消息
        stompClient.send("/app/chat.join",
            {},
            JSON.stringify({sender: username, type: 'JOIN'})
        );
    });
}

function disconnect() {
    if (stompClient !== null) {
        // 发送离开消息
        stompClient.send("/app/chat.leave",
            {},
            JSON.stringify({sender: username, type: 'LEAVE'})
        );
        stompClient.disconnect();
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageContent = messageInput.value.trim();
    
    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT',
            avatar: userAvatar
        };
        
        stompClient.send("/app/chat.send", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
}

function showMessage(message) {
    const messageArea = document.getElementById('messageArea');
    
    if (message.type === 'JOIN' || message.type === 'LEAVE' || message.type === 'RENAME') {
        // 系统消息
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'system');
        
        if (message.type === 'JOIN') {
            messageElement.textContent = `${message.sender} 加入了聊天室`;
        } else if (message.type === 'LEAVE') {
            messageElement.textContent = `${message.sender} 离开了聊天室`;
        } else if (message.type === 'RENAME') {
            messageElement.textContent = `${message.oldUsername} 改名为 ${message.sender}`;
        }
        
        messageArea.appendChild(messageElement);
    } else {
        // 聊天消息
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');
        messageContainer.classList.add(message.sender === username ? 'sent' : 'received');
        
        // 添加头像
        const avatar = document.createElement('img');
        avatar.src = message.avatar || generateAvatar(message.sender);
        avatar.classList.add('avatar');
        messageContainer.appendChild(avatar);
        
        // 消息内容
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (message.sender !== username) {
            const senderElement = document.createElement('div');
            senderElement.classList.add('sender');
            senderElement.textContent = message.sender;
            messageElement.appendChild(senderElement);
        }
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('content');
        contentElement.textContent = message.content;
        messageElement.appendChild(contentElement);
        
        // 时间戳
        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const timeElement = document.createElement('div');
        timeElement.classList.add('timestamp');
        timeElement.textContent = timestamp;
        messageElement.appendChild(timeElement);
        
        messageContainer.appendChild(messageElement);
        messageArea.appendChild(messageContainer);
    }
    
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 添加文件相关函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateFileList() {
    fetch('/api/files/list')
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '';
            
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('file-item');
                
                fileItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="file-date">${formatDate(file.lastModified)}</span>
                    <div class="actions">
                        <button class="download-btn" onclick="downloadFile('${file.name}')">下载</button>
                        <button class="delete-btn" onclick="deleteFile('${file.name}')">删除</button>
                    </div>
                `;
                
                fileList.appendChild(fileItem);
            });
        })
        .catch(error => console.error('Error:', error));
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请选择文件');
        return;
    }

    // 检查文件大小
    const maxSize = 100 * 1024 * 1024; // 100MB
    for (let file of files) {
        if (file.size > maxSize) {
            alert(`文件 ${file.name} 超过100MB限制，请选择更小的文件`);
            return;
        }
    }
    
    const progressBar = document.getElementById('uploadProgress');
    const progress = progressBar.querySelector('.progress');
    const progressText = progressBar.querySelector('.progress-text');
    
    progressBar.style.display = 'block';
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progress.style.width = percentComplete + '%';
            progressText.textContent = Math.round(percentComplete) + '%';
        }
    });
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert(xhr.responseText);
            fileInput.value = '';
            updateFileList();
        } else {
            alert('上传失败: ' + (xhr.responseText || '文件可能超过大小限制'));
        }
        progressBar.style.display = 'none';
        progress.style.width = '0%';
        progressText.textContent = '0%';
    };
    
    xhr.onerror = function() {
        alert('上传失败');
        progressBar.style.display = 'none';
        progress.style.width = '0%';
        progressText.textContent = '0%';
    };
    
    xhr.open('POST', '/api/files/upload', true);
    xhr.send(formData);
}

function downloadFile(fileName) {
    window.location.href = `/api/files/download/${fileName}`;
}

function deleteFile(fileName) {
    if (confirm(`确定要删除文件 ${fileName} 吗？`)) {
        fetch(`/api/files/delete/${fileName}`, {
            method: 'DELETE'
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            updateFileList();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('删除失败');
        });
    }
}

function showChat() {
    document.getElementById('chatContainer').style.display = 'block';
    document.getElementById('fileContainer').style.display = 'none';
}

function showFileTransfer() {
    document.getElementById('chatContainer').style.display = 'none';
    document.getElementById('fileContainer').style.display = 'block';
    updateFileList(); // 显示文件传输页面时更新文件列表
}

// 页面加载完成后连接WebSocket
document.addEventListener('DOMContentLoaded', function() {
    connect();
});

// 处理回车发送消息
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 添加页面关闭时的处理
window.addEventListener('beforeunload', function() {
    disconnect();
}); 