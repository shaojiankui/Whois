// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// 读取WHOIS解析器配置
function loadWhoisConfig() {
  const configDir = path.resolve(process.cwd(), 'config/whois-configs')
  const configs: { [key: string]: any } = {}
  
  try {
    if (fs.existsSync(configDir)) {
      const files = fs.readdirSync(configDir)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const configName = file
          const configPath = path.join(configDir, file)
          
          try {
            const content = fs.readFileSync(configPath, 'utf8')
            configs[configName] = JSON.parse(content)
          } catch (error) {
            console.warn(`无法加载配置文件 ${file}:`, error)
          }
        }
      }
    }
  } catch (error) {
    console.warn('加载WHOIS配置时出错:', error)
  }
  
  return configs
}

export default defineNuxtConfig({
  devtools: { enabled: true },

  // 运行时配置，可在服务端和客户端通过useRuntimeConfig()访问
  runtimeConfig: {
    // 仅服务端可访问的私有配置
    whoisConfigs: loadWhoisConfig(),
    
    // 可在客户端访问的公共配置
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  modules: [
    ['@nuxtjs/i18n', {
      locales: [
        {
          code: 'en',
          file: 'en.json',
          name: 'English'
        },
        {
          code: 'zh',
          file: 'zh.json',
          name: '中文'
        }
      ],
      restructureDir: false,
      lazy: false,
      langDir: 'locales',
      defaultLocale: 'en',
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: true,
        cookieKey: 'i18n_locale',
      },
      vueI18n: './i18n.config.ts'
    }]
  ],

  css: [
    '~/assets/scss/main.scss',
  ],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Whois Query System',
      meta: [
        { name: 'description', content: 'A comprehensive domain information lookup tool' },
        { name: 'theme-color', content: '#11FCD4' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/variables.scss" as *;
          `
        }
      }
    }
  },

  compatibilityDate: '2025-04-04'
})