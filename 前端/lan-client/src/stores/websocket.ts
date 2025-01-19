import { defineStore } from 'pinia';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useUserStore } from './user';
import type { ChatMessage } from '@/types';

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    stompClient: null as Client | null,
    connected: false,
    connecting: false
  }),

  actions: {
    async connect() {
      if (this.connected || this.connecting) return;

      this.connecting = true;
      const userStore = useUserStore();
      const store = this;

      return new Promise<void>((resolve, reject) => {
        try {
          this.stompClient = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            debug: (str) => {
              console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: function() {
              store.connected = true;
              store.connecting = false;
              
              // 发送加入消息
              this.publish({
                destination: '/app/chat.join',
                body: JSON.stringify({
                  sender: userStore.username,
                  type: 'JOIN'
                })
              });
              
              resolve();
            },
            onDisconnect: function() {
              store.connected = false;
              store.connecting = false;
            },
            onStompError: function(frame) {
              console.error('Broker reported error: ' + frame.headers['message']);
              console.error('Additional details: ' + frame.body);
              store.connecting = false;
              reject(new Error(frame.headers['message']));
            }
          });

          this.stompClient.activate();
        } catch (error) {
          this.connecting = false;
          reject(error);
        }
      });
    },

    disconnect() {
      if (!this.connected) return;

      const userStore = useUserStore();
      
      // 发送离开消息
      this.stompClient?.publish({
        destination: '/app/chat.leave',
        body: JSON.stringify({
          sender: userStore.username,
          type: 'LEAVE'
        })
      });
      
      this.stompClient?.deactivate();
      this.connected = false;
      this.connecting = false;
      this.stompClient = null;
    }
  }
}); 