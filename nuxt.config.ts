// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'path'

export default defineNuxtConfig({
  devtools: { enabled: true },

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
            @import "@/assets/scss/variables.scss";
          `
        }
      }
    }
  },

  compatibilityDate: '2025-04-04'
})