<template>
  <div class="chat-wrapper">
    <div class="chat-history" ref="chatContainer">
      <div
        v-for="(msg, index) in chatMessages"
        :key="index"
        :class="['chat-bubble', msg.userId === myId ? 'right' : 'left']"
      >
        {{ msg.message }}
      </div>
    </div>

    <div class="input-box">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="输入你的消息"
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const myId = localStorage.getItem('userId') || crypto.randomUUID()
localStorage.setItem('userId', myId)

const chatMessages = ref<{ message: string; userId: string }[]>([])
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

  // 本地显示
  chatMessages.value.push({ message: input.value, userId: myId })
  scrollToBottom()

  await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input.value, userId: myId }),
  })

  input.value = ''
}

const startStream = () => {
  eventSource = new EventSource('/api/chat/stream')

  eventSource.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    if (data.userId !== myId) {
      chatMessages.value.push({ message: data.message, userId: data.userId })
      scrollToBottom()
    }
  }

  eventSource.onerror = () => {
    console.error('SSE 连接出错')
    eventSource?.close()
  }
}

onMounted(() => {
  startStream()
})

onBeforeUnmount(() => {
  eventSource?.close()
})
</script>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
</style>
