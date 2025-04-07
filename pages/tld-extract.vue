<template>
  <div class="tld-extract-page container">
    <div >
      <h1>{{ $t('tldExtract.title') }}</h1>
      <p class="description">
        {{ $t('tldExtract.description') }}
      </p>
      
      <div class="extract-form">
        <div class="input-group">
          <input 
            v-model="domain" 
            type="text" 
            class="w-input"
            :placeholder="$t('tldExtract.inputPlaceholder')" 
            @keyup.enter="extractDomain"
          />
          <button class="w-button" @click="extractDomain" :disabled="!domain || isLoading">
            {{ isLoading ? $t('tldExtract.loading') : $t('tldExtract.submit') }}
          </button>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <div v-if="result" class="result-section">
        <h2>{{ $t('tldExtract.results.title') }}</h2>
        <div class="standard-card">
          <div class="result-item">
            <span class="label">{{ $t('tldExtract.results.domain') }}:</span>
            <span class="value">{{ result.domain }}</span>
          </div>
          <div class="result-item">
            <span class="label">{{ $t('tldExtract.results.prefix') }}:</span>
            <span class="value">{{ result.prefix }}</span>
          </div>
          <div class="result-item">
            <span class="label">{{ $t('tldExtract.results.suffix') }}:</span>
            <span class="value">{{ result.suffix }}</span>
          </div>
          <div v-if="result.subdomain" class="result-item">
            <span class="label">{{ $t('tldExtract.results.subdomain') }}:</span>
            <span class="value">{{ result.subdomain }}</span>
          </div>
          <div v-if="result.parentPrefix" class="result-item">
            <span class="label">{{ $t('tldExtract.results.parentPrefix') }}:</span>
            <span class="value">{{ result.parentPrefix }}</span>
          </div>
        </div>
        
        <div class="examples mt-4">
          <h3>{{ $t('tldExtract.examples.description') }}</h3>
          <p v-if="$i18n.locale === 'zh'">对于域名的解析结果说明：</p>
          <ul>
            <li v-if="$i18n.locale === 'zh'">
              <strong>www.example.com</strong>: 
              前缀 = example, 后缀 = com, 子域名 = www
            </li>
            <li v-if="$i18n.locale === 'zh'">
              <strong>example.co.uk</strong>: 
              前缀 = example, 后缀 = co.uk, 父级前缀 = co
            </li>
            <li v-if="$i18n.locale === 'zh'">
              <strong>sub.example.org</strong>: 
              前缀 = example, 后缀 = org, 子域名 = sub
            </li>
            <li v-if="$i18n.locale === 'zh'">
              <strong>a.b.c.com</strong>: 
              前缀 = c, 后缀 = com, 子域名 = a.b
            </li>
            
            <li v-if="$i18n.locale === 'en'">
              <strong>www.example.com</strong>: 
              prefix = example, suffix = com, subdomain = www
            </li>
            <li v-if="$i18n.locale === 'en'">
              <strong>example.co.uk</strong>: 
              prefix = example, suffix = co.uk, parent prefix = co
            </li>
            <li v-if="$i18n.locale === 'en'">
              <strong>sub.example.org</strong>: 
              prefix = example, suffix = org, subdomain = sub
            </li>
            <li v-if="$i18n.locale === 'en'">
              <strong>a.b.c.com</strong>: 
              prefix = c, suffix = com, subdomain = a.b
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="examples-section mt-4" v-if="!result">
      <h3>{{ $t('tldExtract.examples.description') }}</h3>
      <p v-if="$i18n.locale === 'zh'">对于域名的解析结果说明：</p>
      
      <div class="standard-card mt-2">
        <h2>{{ $t('tldExtract.examples.title') }}</h2>
        <div class="example-list">
          <div class="example-item" v-for="(example, index) in examples" :key="index" @click="setExample(example)">
            {{ example }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiGet } from '~/utils/api';

// 响应式状态
const domain = ref('');
const result = ref(null);
const error = ref('');
const isLoading = ref(false);

// 示例域名
const examples = [
  'www.example.com',
  'example.co.uk',
  'sub.example.org',
  'a.b.c.com',
  'something.blogspot.com',
  'example.com.cn',
  'test.github.io',
  'www.gov.uk'
];

// 设置示例
function setExample(example: string) {
  domain.value = example;
  extractDomain();
}

// 域名解析
async function extractDomain() {
  if (!domain.value) {
    error.value = $t('tldExtract.error');
    return;
  }
  
  error.value = '';
  isLoading.value = true;
  result.value = null;
  
  try {
    const data = await apiGet(`/api/tldextract?domain=${encodeURIComponent(domain.value)}`);
    result.value = data;
  } catch (err: any) {
    error.value = err.message || $t('error.unknown');
    console.error('域名解析请求出错:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.tld-extract-page {
  padding: 2rem 0;
}

.description {
  margin-bottom: 2rem;
}

.extract-form {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  margin-bottom: 1rem;
}

.input-group input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.error-message {
  color: var(--error-color);
  margin-top: 0.5rem;
}

.result-section {
  margin-top: 2rem;
}

.result-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  display: flex;
}

.result-item:last-child {
  border-bottom: none;
}

.label {
  flex: 0 0 120px;
  font-weight: 600;
}

.value {
  flex: 1;
  word-break: break-all;
}

.examples {
  margin-top: 1.5rem;
}

h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.examples-section {
  margin-top: 2rem;
}

.example-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.example-item {
  padding: 0.5rem 1rem;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.example-item:hover {
  background-color: var(--primary-color);
  color: #000;
}
.w-button{
    width: 150px;
}
</style> 