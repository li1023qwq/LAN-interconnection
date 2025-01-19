let peerConnections = {};
let localStream = null;
let isSharing = false;
let activeShares = new Map(); // 存储活动的共享会话
let currentWatching = null; // 当前正在观看的共享ID

// 创建并返回一个新的RTCPeerConnection
function createPeerConnection(viewerId) {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });

    // 添加本地流
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }

    // 处理ICE候选
    pc.onicecandidate = event => {
        if (event.candidate) {
            stompClient.send("/app/screen.candidate", {}, JSON.stringify({
                candidate: event.candidate,
                viewerId: viewerId
            }));
        }
    };

    return pc;
}

// 开始屏幕共享
async function startScreenShare() {
    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        const video = document.getElementById('screenVideo');
        video.srcObject = localStream;

        // 监听共享停止事件
        localStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };

        document.getElementById('startShareBtn').style.display = 'none';
        document.getElementById('stopShareBtn').style.display = 'inline-block';
        isSharing = true;

        // 通知服务器开始共享
        stompClient.send("/app/screen.start", {}, JSON.stringify({
            sender: username,
            type: 'start',
            avatar: userAvatar
        }));

    } catch (err) {
        console.error("Error: " + err);
        alert('无法启动屏幕共享: ' + err.message);
    }
}

// 停止屏幕共享
function stopScreenShare() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    document.getElementById('screenVideo').srcObject = null;
    document.getElementById('startShareBtn').style.display = 'inline-block';
    document.getElementById('stopShareBtn').style.display = 'none';
    isSharing = false;

    // 通知服务器停止共享
    stompClient.send("/app/screen.stop", {}, JSON.stringify({
        sender: username
    }));

    // 清理所有连接
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    updateViewerCount();
}

// 处理观看请求
async function handleViewRequest(viewerId) {
    console.log('Handling view request from:', viewerId);
    if (!isSharing || !localStream) {
        console.log('Not sharing or no local stream');
        return;
    }

    const pc = createPeerConnection(viewerId);
    peerConnections[viewerId] = pc;

    try {
        // 添加所有轨道
        localStream.getTracks().forEach(track => {
            console.log('Adding track to peer connection:', track.kind);
            pc.addTrack(track, localStream);
        });

        console.log('Creating offer');
        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        console.log('Setting local description');
        await pc.setLocalDescription(offer);

        console.log('Sending offer to viewer');
        stompClient.send("/app/screen.offer", {}, JSON.stringify({
            offer: offer,
            viewerId: viewerId,
            sender: username,
            type: 'offer'
        }));
    } catch (err) {
        console.error('Error creating offer:', err);
    }

    updateViewerCount();
}

// 处理观看者的应答
async function handleAnswer(answer, viewerId) {
    console.log('Received answer from:', viewerId);
    const pc = peerConnections[viewerId];
    if (pc) {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Set remote description success');
        } catch (err) {
            console.error('Error setting remote description:', err);
        }
    }
}

// 处理ICE候选
async function handleCandidate(candidate, viewerId) {
    console.log('Received ICE candidate from:', viewerId);
    const pc = peerConnections[viewerId];
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added ICE candidate success');
        } catch (err) {
            console.error('Error adding ice candidate:', err);
        }
    }
}

// 更新观看人数
function updateViewerCount() {
    const count = Object.keys(peerConnections).length;
    document.getElementById('viewerCount').textContent = count;
}

// 显示屏幕共享页面
function showScreenShare() {
    document.getElementById('chatContainer').style.display = 'none';
    document.getElementById('fileContainer').style.display = 'none';
    document.getElementById('screenShareContainer').style.display = 'block';
    updateShareList(); // 显示时更新列表
}

// 更新共享列表
function updateShareList() {
    const shareList = document.getElementById('shareList');
    shareList.innerHTML = '';
    
    activeShares.forEach((share, sharerId) => {
        const shareItem = document.createElement('div');
        shareItem.classList.add('share-item');
        if (currentWatching === sharerId) {
            shareItem.classList.add('watching');
        }
        
        shareItem.innerHTML = `
            <div class="user-info">
                <img src="${generateAvatar(share.sender)}" class="avatar" alt="avatar">
                <span>${share.sender}</span>
            </div>
            <div class="actions">
                ${currentWatching === sharerId 
                    ? '<button onclick="stopWatching()">停止观看</button>'
                    : `<button onclick="startWatching('${sharerId}')">观看</button>`}
            </div>
        `;
        
        shareList.appendChild(shareItem);
    });
}

// 开始观看
async function startWatching(sharerId) {
    if (currentWatching) {
        stopWatching();
    }
    
    currentWatching = sharerId;
    
    // 创建新的RTCPeerConnection
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    });
    
    peerConnections[sharerId] = pc;
    
    // 设置远程视频流
    pc.ontrack = event => {
        console.log('Received remote track:', event.streams[0]);
        const video = document.getElementById('screenVideo');
        video.srcObject = event.streams[0];
    };
    
    // 处理ICE候选
    pc.onicecandidate = event => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            stompClient.send("/app/screen.candidate", {}, JSON.stringify({
                candidate: event.candidate,
                viewerId: sharerId,
                sender: username
            }));
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
    };
    
    try {
        // 创建空的音视频轨道
        const stream = new MediaStream();
        const video = document.getElementById('screenVideo');
        video.srcObject = stream;
        
        // 发送观看请求
        console.log('Sending view request to:', sharerId);
        stompClient.send("/app/screen.view", {}, JSON.stringify({
            sender: username,
            viewerId: sharerId,
            type: 'view'
        }));
        
        updateShareList();
    } catch (err) {
        console.error('Error starting to watch:', err);
        stopWatching();
        alert('无法开始观看: ' + err.message);
    }
}

// 停止观看
function stopWatching() {
    if (!currentWatching) return;
    
    const video = document.getElementById('screenVideo');
    video.srcObject = null;
    
    if (peerConnections[currentWatching]) {
        peerConnections[currentWatching].close();
        delete peerConnections[currentWatching];
    }
    
    currentWatching = null;
    updateShareList();
}

// 修改原有的WebSocket消息处理
function handleScreenMessage(message) {
    console.log('Received screen message:', message); // 添加调试日志
    
    switch (message.type) {
        case 'start':
            console.log('Adding share to list:', message.sender);
            activeShares.set(message.sender, message);
            updateShareList();
            break;
            
        case 'stop':
            console.log('Removing share from list:', message.sender);
            activeShares.delete(message.sender);
            if (currentWatching === message.sender) {
                stopWatching();
            }
            updateShareList();
            break;
            
        case 'view':
            if (isSharing && message.viewerId === username) {
                handleViewRequest(message.sender);
            }
            break;
            
        case 'offer':
            handleOffer(message);
            break;
            
        case 'answer':
            handleAnswer(message.answer, message.viewerId);
            break;
            
        case 'candidate':
            handleCandidate(message.candidate, message.viewerId);
            break;
    }
}

// 在connect函数中添加屏幕共享消息订阅
stompClient.subscribe('/topic/screen', function(message) {
    handleScreenMessage(JSON.parse(message.body));
});

async function handleOffer(message) {
    console.log('Received offer from:', message.sender);
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    });
    
    peerConnections[message.sender] = pc;
    
    pc.ontrack = event => {
        console.log('Received track:', event.track.kind);
        const video = document.getElementById('screenVideo');
        if (video.srcObject !== event.streams[0]) {
            console.log('Setting video stream');
            video.srcObject = event.streams[0];
        }
    };
    
    pc.onicecandidate = event => {
        if (event.candidate) {
            console.log('Sending ICE candidate to sharer');
            stompClient.send("/app/screen.candidate", {}, JSON.stringify({
                candidate: event.candidate,
                viewerId: message.sender,
                sender: username,
                type: 'candidate'
            }));
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
    };
    
    try {
        console.log('Setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
        
        console.log('Creating answer');
        const answer = await pc.createAnswer();
        
        console.log('Setting local description');
        await pc.setLocalDescription(answer);
        
        console.log('Sending answer to sharer');
        stompClient.send("/app/screen.answer", {}, JSON.stringify({
            answer: answer,
            viewerId: message.sender,
            sender: username,
            type: 'answer'
        }));
    } catch (err) {
        console.error('Error handling offer:', err);
    }
} 