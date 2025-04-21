<template>
  <div class="chat-room-container">
    <div class="chat-wrapper">
      <div class="chat-history" ref="chatContainer">
        <div v-for="(msg, index) in chatMessages" :key="msg.timestamp"
          :class="['chat-bubble-wrapper', msg.userId === myId ? 'right' : 'left']">
          <div v-if="msg.userId !== myId" class="avatar"
            :style="{ backgroundColor: getUserInfo(msg.userId).color || '#ccc' }">
            {{ getUserInfo(msg.userId).nickname.slice(0, 2) || '??' }}
          </div>
          <div>
            <div class="nickname" v-if="msg.userId !== myId">{{ getUserInfo(msg.userId).nickname }}</div>
            <div class="chat-bubble" :class="msg.userId === myId ? 'right' : 'left'">
              <div class="message-text">{{ msg.message }}</div>
            </div>
            <div :class="['message-time', msg.userId === myId ? 'r-time' : 'l-time']">
              {{ formatTime(msg.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <div class="input-box">
        <input v-model="input" @keyup.enter="sendMessage" placeholder="输入你的消息" />
        <button @click="sendMessage">发送</button>
      </div>
    </div>
    <UserList :userIds="Array.from(userSet)" :getUserInfo="getUserInfo" :chatMessages="chatMessages" :myId="myId" />
  </div>
</template>

<script setup lang="ts">
import UserList from './UserList.vue'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const userSet = ref<Set<string>>(new Set())

// 每次有新消息就把 userId 放进去
const addUserIfNotExists = (userId: string) => {
  if (!userSet.value.has(userId)) {
    userSet.value.add(userId)
  }
}

const generateNickname = (userId: string) => {
  return `User-${userId.slice(0, 4)}`
}

const avatarColors = ['#FF9AA2', '#FFB347', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#A0CED9', '#E0BBE4', '#D5AAFF']
const generateColor = (userId: string) => {
  const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return avatarColors[hash % avatarColors.length]
}

const myId = localStorage.getItem('userId') || uuidv4()
const myNickname = localStorage.getItem('nickname') || generateNickname(myId)
const myColor = localStorage.getItem('avatarColor') || generateColor(myId)
localStorage.setItem('userId', myId)
localStorage.setItem('nickname', myNickname)
localStorage.setItem('avatarColor', myColor)

const userInfoMap = new Map<string, { nickname: string; color: string }>()

const getUserInfo = (userId: string): { nickname: string; color: string } => {
  if (userId === myId) {
    return { nickname: myNickname, color: myColor }
  }

  if (!userInfoMap.has(userId)) {
    const nickname = generateNickname(userId)
    const color = generateColor(userId)
    const info = { nickname, color }
    userInfoMap.set(userId, info)
    return info
  }
  return userInfoMap.get(userId)!
}


const chatMessages = ref<{ message: string; userId: string, timestamp: string }[]>([])
const input = ref('')
const chatContainer = ref<HTMLDivElement | null>(null)
let eventSource: EventSource | null = null

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!input.value.trim()) return

  try {
    // 本地显示
    const timestamp = new Date().toISOString()
    chatMessages.value.push({ message: input.value, userId: myId, timestamp })
    addUserIfNotExists(myId)
    scrollToBottom()

    await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.value, userId: myId, timestamp }),
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  }

  input.value = ''
}

const startStream = () => {
  eventSource = new EventSource('/api/chat/stream')

  eventSource.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    if (data.userId !== myId) {
      chatMessages.value.push(data)
      addUserIfNotExists(data.userId)
      scrollToBottom()
    }
  }

  eventSource.onerror = () => {
    console.error('SSE 连接出错，尝试重连...')
    eventSource?.close()
    setTimeout(() => {
      startStream()
    }, 1000)
  }
}

const getChatHistory = async () => {
  const response = await fetch('/api/chat/history')
  const data = await response.json()
  chatMessages.value = data.map((msg) => {
    addUserIfNotExists(msg.userId)
    return msg
  })
  scrollToBottom()
}

const formatTime = (timestamp: string) => {

  const date = new Date(timestamp)
  const now = new Date()

  const padZero = (num: number) => num.toString().padStart(2, '0')

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())

  if (isToday) {
    return `${hours}:${minutes}`
  } else if (isYesterday) {
    return `昨天 ${hours}:${minutes}`
  } else {
    const y = date.getFullYear()
    const m = padZero(date.getMonth() + 1)
    const d = padZero(date.getDate())
    return `${y}-${m}-${d} ${hours}:${minutes}`
  }
}


onMounted(() => {
  getChatHistory()
  startStream()
})

onBeforeUnmount(() => {
  eventSource?.close()
})
</script>

<style scoped>
.chat-room-container {
  display: flex;
  height: 100vh;
}

.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa;
}

.chat-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 16px;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-bubble.left {
  background-color: #f0f0f0;
  color: #333;
  align-self: flex-start;
  border-top-left-radius: 0;
}

.chat-bubble.right {
  background-color: #cce5ff;
  color: #333;
  align-self: flex-end;
  border-top-right-radius: 0;
}

.input-box {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ddd;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

input {
  flex: 1;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background-color: #409eff;
  color: white;
}

.message-text {
  margin-bottom: 4px;
}

.message-time.r-time {
  color: #aaa;
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
}

.message-time.l-time {
  color: #aaa;
  font-size: 12px;
  margin-top: 4px;
  text-align: left;
}

.chat-bubble-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.chat-bubble-wrapper.left {
  flex-direction: row;
}

.chat-bubble-wrapper.right {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nickname {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}
</style>
