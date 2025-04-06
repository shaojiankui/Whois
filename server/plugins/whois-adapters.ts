import { initWhoisAdapters } from '../utils/whois-adapters/index';

/**
 * Nuxt插件，初始化WHOIS适配器系统
 */
export default defineNitroPlugin(() => {
  console.log('Initializing WHOIS adapter system...');
  initWhoisAdapters();
}); 