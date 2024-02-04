<route lang="yaml">
meta:
  title: 支付宝支付设置
      </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  payAliStatus: '',
  payAliMchId: '',
  payAliMchKey: '',
  payAliMchSecret: '',
  payAliNotifyUrl: '',
  payAliH5Url: '',
})

const rules = ref<FormRules>({
  payAliStatus: [{ required: true, trigger: 'change', message: '请选择当前支付开启状态' }],
  payAliMchId: [{ required: true, trigger: 'blur', message: '请填写商户ID' }],
  payAliMchKey: [{ required: true, trigger: 'blur', message: '请填写商户KEY' }],
  payAliMchSecret: [{ required: true, trigger: 'blur', message: '请填写商户秘钥' }],
  payAliNotifyUrl: [{ required: true, trigger: 'blur', message: '请填写支付通知地址' }],
  payAliH5Url: [{ required: true, trigger: 'blur', message: '请填写H5支付通知地址' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['payAliMchSecret', 'payAliNotifyUrl', 'payAliH5Url', 'payAliMchKey', 'payAliStatus', 'payAliMchId'] })
  Object.assign(formInline, res.data)
}

function handlerUpdateConfig() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await apiConfig.setConfig({ settings: fotmatSetting(formInline) })
        ElMessage.success('变更配置信息成功')
      }
      catch (error) {}
      queryAllconfig()
    }
    else {
      ElMessage.error('请填写完整信息')
    }
  })
}

function fotmatSetting(settings: any) {
  return Object.keys(settings).map((key) => {
    return {
      configKey: key,
      configVal: settings[key],
    }
  })
}

onMounted(() => {
  queryAllconfig()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="支付宝支付参数说明" description="支付宝支付设置、我们将调用支付宝Jsapi支付、请确认您的支付宝支付已经申请了支付权限、所有的支付通知地址统一为 https://域名/api/pay/notify 将域名修改为您的域名即可！" type="warning" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>支付宝支付参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="140px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="启用当前支付" prop="payAliStatus">
              <el-switch
                v-model="formInline.payAliStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="商户ID" prop="payAliMchId">
              <el-input v-model="formInline.payAliMchId" placeholder="请填写商户ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="商户KEY" prop="payAliMchKey">
              <el-input v-model="formInline.payAliMchKey" placeholder="请填写商户KEY" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="商户秘钥" prop="payAliMchSecret">
              <el-input v-model="formInline.payAliMchSecret" placeholder="请填写商户秘钥" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付通知地址" prop="payAliNotifyUrl">
              <el-input v-model="formInline.payAliNotifyUrl" placeholder="请填写支付通知地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="H5支付通知地址" prop="payAliH5Url">
              <el-input v-model="formInline.payAliH5Url" placeholder="请填写H5支付通知地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
