<script lang='ts' setup>
import { computed } from 'vue'
import { NAlert } from 'naive-ui'
import { useAuthStore } from '@/store'

const authStore = useAuthStore()

const registerSendStatus = computed(() => Number(authStore.globalConfig.registerSendStatus))
const registerSendModel3Count = computed(() => Number(authStore.globalConfig.registerSendModel3Count))
// const registerSendModel4Count = computed(() => Number(authStore.globalConfig.registerSendModel4Count))
const registerSendDrawMjCount = computed(() => Number(authStore.globalConfig.registerSendDrawMjCount))
const registerTips = computed(() => (`首次认证：赠送${registerSendModel3Count.value}积分聊天模型余额 | ${registerSendDrawMjCount.value}积分绘画余额`))
</script>

<template>
  <div v-if="registerSendStatus">
    <NAlert type="success" :show-icon="false" class="mt-5">
      <div class="register-tips">
        {{ registerTips }}
      </div>
    </NAlert>
  </div>
</template>

<style scoped>
.register-tips {
	display: flex;
	justify-content: center;
}
</style>
