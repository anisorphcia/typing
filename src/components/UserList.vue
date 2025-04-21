<template>
  <div class="user-list">
    <h3>在线用户 ({{ userIds.length }})</h3>
    <ul>
      <li v-for="id in userIds" :key="id" class="user-item" :class="{ 'me': id === myId }">
        <span class="avatar" :style="{ backgroundColor: getUserInfo(id).color }">
          {{ getUserInfo(id).nickname.slice(0, 2) }}
        </span>
        <span class="nickname">{{ getUserInfo(id).nickname }}</span>
        <span class="count">{{ getMessageCount(id) }} </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { userIds, getUserInfo, chatMessages, myId } = defineProps<{
  userIds: string[]
  getUserInfo: (id: string) => { nickname: string; color: string }
  chatMessages: { message: string; userId: string; timestamp: string }[]
  myId: string
}>()

const getMessageCount = (userId: string) => {
  return chatMessages.filter((msg) => msg.userId === userId).length
}
</script>



<style scoped>
.user-list {
  width: 220px;
  padding: 16px;
  border-left: 1px solid #ddd;
  background-color: #fff;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.user-item.me {
  background-color: #e6f7ff;
  border-radius: 6px;
  padding: 4px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  color: #fff;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nickname {
  font-weight: bold;
  flex: 1;
}

.count {
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #999;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
