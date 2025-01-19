import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const username = ref<string>(localStorage.getItem('username') || '');
  const avatar = ref<string>('');

  function generateAvatar(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    const color = colors[Math.floor(name.length % colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.substring(1)}&color=fff`;
  }

  function setUsername(newUsername: string) {
    username.value = newUsername;
    localStorage.setItem('username', newUsername);
    avatar.value = generateAvatar(newUsername);
  }

  // 初始化用户名
  if (!username.value) {
    const defaultUsername = `用户${Math.floor(Math.random() * 1000)}`;
    setUsername(defaultUsername);
  } else {
    avatar.value = generateAvatar(username.value);
  }

  return {
    username,
    avatar,
    setUsername,
    generateAvatar
  };
}); 