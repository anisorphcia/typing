<template>
  <div>
    <!-- 手机端切换按钮 -->
    <button class="toggle-button" v-if="isMobile" @click="toggleList">
      {{ showList ? '关闭列表' : '在线用户' }}
    </button>

    <!-- 用户列表 -->
    <div class="user-list" :class="{ mobile: isMobile, show: showList }" v-show="!isMobile || showList">
      <h3>在线用户 ({{ userIds.length }})</h3>
      <ul>
        <li v-for="id in userIds" :key="id" class="user-item" :class="{ me: id === myId }">
          <span class="avatar" :style="{ backgroundColor: getUserInfo(id).color }">
            {{ getUserInfo(id).nickname.slice(0, 2) }}
          </span>
          <span class="nickname">{{ getUserInfo(id).nickname }}</span>
          <span class="count">{{ getMessageCount(id) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { userIds, getUserInfo, chatMessages, myId } = defineProps<{
  userIds: string[]
  getUserInfo: (id: string) => { nickname: string; color: string }
  chatMessages: { message: string; userId: string; timestamp: string }[]
  myId: string
}>()

const getMessageCount = (userId: string) => {
  return chatMessages.filter((msg) => msg.userId === userId).length
}

const isMobile = ref(false)
const showList = ref(false)

const toggleList = () => {
  showList.value = !showList.value
}

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
})
</script>




<style scoped>
.user-list {
  width: 220px;
  padding: 16px;
  border-left: 1px solid #ddd;
  background-color: #fff;
  overflow-y: auto;
  height: 100vh;
}

/* 高亮自己 */
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

/* 手机端用户列表浮动 */
.user-list.mobile {
  position: fixed;
  top: 60px;
  right: 10px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  width: 80vw;
  border-radius: 10px;
  display: none;
  transition: all 0.3s ease;
}

.user-list.mobile.show {
  display: block;
}

/* 手机端按钮 */
.toggle-button {
  display: none;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1100;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background-color: #409eff;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 仅手机端显示切换按钮 */
@media (max-width: 768px) {
  .toggle-button {
    display: block;
  }

  .user-list {
    display: none;
    border-left: none;
  }
}
</style>
