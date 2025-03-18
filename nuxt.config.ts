// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  vite:{
    css:{
      preprocessorOptions:{
        scss:{
          additionalData: '@use "@/assets/common.scss" as *;'
        }
      }
    }
  }
})
