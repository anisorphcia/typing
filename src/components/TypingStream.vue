<template>
  <div class="chat-container">
    <div v-for="(msg, index) in messages" :key="index" :class="['chat-bubble', msg.isUser ? 'user' : 'server']">
      {{ msg.text }}
      <span v-if="msg.isTyping && !msg.isUser">▍</span>
    </div>

    <div class="input-area">
      <input v-model="input" @keyup.enter="sendMessage" placeholder="请输入内容..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

interface Message {
  text: string
  isUser: boolean
  isTyping?: boolean
}

const messages = ref<Message[]>([])
const input = ref('')
let eventSource: EventSource | null = null
let currentServerMessage: Message | null = null

// 发送用户消息
const sendMessage = async () => {
  const content = input.value.trim()
  if (!content) return

  // 添加用户气泡
  messages.value.push({ text: content, isUser: true })

  // 准备服务端气泡，文本先空
  currentServerMessage = { text: '', isUser: false, isTyping: true }
  messages.value.push(currentServerMessage)

  // 清空输入框
  input.value = ''

  try {
    await axios.post('/api/chat/message', { message: content })
    // 后台接收后就会触发 SSE 推送
  } catch (err) {
    console.error('发送失败', err)
    currentServerMessage.isTyping = false
    currentServerMessage.text = '[发送失败]'
  }
}

// 初始化 SSE 长连接
const startSSE = () => {
  eventSource = new EventSource('/api/chat/stream')

  eventSource.onmessage = (event: MessageEvent) => {
    if (event.data === '[DONE]') {
      const lastMsg = messages.value.findLast(m => !m.isUser && m.isTyping)
      if (lastMsg) lastMsg.isTyping = false
    } else {
      const lastMsg = messages.value.findLast(m => !m.isUser && m.isTyping)
      if (lastMsg) lastMsg.text += event.data
    }
  }

  eventSource.onerror = () => {
    console.error('SSE 连接失败')
    eventSource?.close()
  }
}

onMounted(() => {
  startSSE()
})

onBeforeUnmount(() => {
  eventSource?.close()
})
</script>

<style scoped>
.chat-container {
  max-width: 600px;
  margin: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  white-space: pre-wrap;
  position: relative;
  font-size: 16px;
  line-height: 1.5;
}

.user {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
  border-bottom-right-radius: 0;
}

.user::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 8px;
  border: 8px solid transparent;
  border-left-color: #007bff;
}

.server {
  align-self: flex-start;
  background-color: #e5e5e5;
  color: #000;
  border-bottom-left-radius: 0;
}

.server::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 8px;
  border: 8px solid transparent;
  border-right-color: #e5e5e5;
}

.input-area {
  margin-top: auto;
}

input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
}
</style>
