<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-bottom">
        <p class="copyright">
          &copy; {{ currentYear }} {{ $t('header.title') }}. {{ $t('footer.rights') }}
        </p>
        <div class="social-links">
            <a href="https://github.com/shaojiankui/Whois" target="_blank" class="social-link" :aria-label="$t('footer.githubLink')" :title="$t('footer.githubLink')">
              <i class="social-icon github"></i>
            </a>
            <a href="https://x.com/TianHu_" target="_blank" class="social-link" :aria-label="$t('footer.twitterLink')" :title="$t('footer.twitterLink')">
              <i class="social-icon twitter"></i>
            </a>
            <NuxtLink to="/changelog" class="social-link" :aria-label="$t('footer.changelogLink')" :title="$t('footer.changelogLink')">
              <i class="social-icon changelog"></i>
            </NuxtLink>
          </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 获取当前年份
const currentYear = computed(() => new Date().getFullYear());
</script>

<style lang="scss" scoped>
.footer {
  background-color: var(--footer-bg);
  padding: 1rem;
  border-top: 1px solid #222;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 2rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .social-links {
    display: flex;
    gap: 1rem;
    
    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: #333;
      border-radius: 50%;
      color: #ffffff;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s, transform 0.2s;
      
      &:hover {
        background-color: var(--primary-color);
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
      }
      
      .social-icon {
        width: 18px;
        height: 18px;
        display: block;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        
        &.github {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E");
        }
        
        &.twitter {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E");
        }
        
        &.changelog {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h6v2H9v-2zm0 4h6v2H9v-2z'/%3E%3C/svg%3E");
        }
      }
    }
  }
  
  .footer-bottom {
    text-align: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .copyright {
      color: var(--muted-text);
      font-size: 0.9rem;
    }
  }
}
</style> 