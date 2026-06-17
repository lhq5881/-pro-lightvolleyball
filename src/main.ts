import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { CLOUD_ENV_ID } from '@/services/cloud-config'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // #ifdef MP-WEIXIN
  wx.cloud.init({
    env: CLOUD_ENV_ID,
    traceUser: true
  })
  // #endif

  return { app, pinia }
}