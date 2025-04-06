<template>
    <div class="whois-result-container">
        <DomainInput class="search-input" :domain="domain" />

        <div v-if="isLoading" class="loading-container">
            <div class="loader"></div>
            <p>{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="error" class="error-container">
            <div class="error-icon">❌</div>
            <h2>{{ t('errors.whoisError') }}</h2>
            <p>{{ error }}</p>
            <button @click="loadDomainInfo" class="w-button">{{ t('common.submit') }}</button>
        </div>

        <div v-else-if="whoisData" class="result-content">
            <div class="domain-header">
                <h1>{{ domain }}</h1>
                <div class="domain-status" :class="statusClass">
                    {{ statusText }}
                </div>
            </div>
            <div class="whois-result-item">

                <!-- Whois 格式化数据显示 -->
                <div class="formatted-data">
                    <!-- 使用WhoisDisplay组件，禁用组件内的按钮 -->
                    <WhoisDisplay :domain="domain" :data="whoisDisplayData" :showRegistrantInfo="true"
                        :showButtons="false" />
                </div>

                <!-- 原始WHOIS数据 -->
                <div class="raw-data">
                    <div class="raw-data-header" @click="toggleRawData">
                        <h3 class="raw-data-title">{{ $t('whois.rawData') }}</h3>
                        <div class="toggle-icon">
                            <span>{{ showRawData ? '−' : '+' }}</span>
                        </div>
                    </div>
                    <div v-if="showRawData" class="raw-data-content">
                        <pre>{{ whoisData?.rawText }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import WhoisDisplay from '~/components/WhoisDisplay.vue';
import type { WhoisDisplayData, WhoisTag } from '~/types/whois';
import { generateDomainTags } from '~/utils/domain-tags';
import { apiGet } from '~/utils/api';

// i18n setup
const { t } = useI18n();

// 页面路由
const route = useRoute();
const router = useRouter();
const domain = ref('');

// 数据状态
const whoisData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const showRawData = ref(false);

// 收藏状态
const isFavorited = ref(false);

// 域名状态计算
const statusClass = computed(() => {
    if (!whoisData.value?.data) return '';

    if (whoisData.value.data.isAvailable) {
        return 'status-available';
    } else if (whoisData.value.data.reserved) {
        return 'status-reserved';
    } else {
        return 'status-registered';
    }
});

const statusText = computed(() => {
    if (!whoisData.value?.data) return '';

    if (whoisData.value.data.isAvailable) {
        return t('whois.available');
    } else if (whoisData.value.data.reserved) {
        return t('whois.reserved');
    } else if (whoisData.value.data.premium) {
        return t('whois.premium');
    } else {
        return t('whois.notAvailable');
    }
});

// 为WhoisDisplay组件准备数据
const whoisDisplayData = computed<WhoisDisplayData>(() => {
    if (!whoisData.value?.data && !whoisData.value?.formatted) return {};

    const data = whoisData.value?.data || {};
    const formatted = whoisData.value?.formatted || {};

    // 构建状态对象
    const domainStatus: Record<string, string> = {};
    if (data.status && Array.isArray(data.status)) {
        data.status.forEach(status => {
            // 提取状态描述（如果有括号包含的描述）
            const match = status.match(/(.*?)(?:\s*\((.*?)\))?$/);
            if (match) {
                const [, statusName, description] = match;
                domainStatus[statusName.trim()] = description || '';
            } else {
                domainStatus[status] = '';
            }
        });
    }

    // 生成域名标签
    let tags: WhoisTag[] = [];

    // 检查是否已经有标签数据
    if (data.tags && Array.isArray(data.tags)) {
        // 使用服务器返回的标签
        tags = [...data.tags];
    } else {
        // 使用辅助函数生成标签
        tags = generateDomainTags(
            domain.value,
            data.creationDate || formatted.domain?.created_date,
            data.expiryDate || formatted.domain?.expired_date,
            data.premium,
            t
        );
    }

    return {
        expirationDate: formatDate(data.expiryDate || formatted.domain?.expired_date),
        updatedDate: formatDate(data.updatedDate || formatted.domain?.updated_date),
        creationDate: formatDate(data.creationDate || formatted.domain?.created_date),
        domainStatus: domainStatus,
        sponsoringRegistrar: data.registrar || formatted.registrar?.registrar_name,
        registrarIANAID: formatted.registrar?.registrar_ianaid,
        registryDomainID: data.domainId || formatted.domain?.registry_domain_id,
        nameServers: data.nameServers || formatted.domain?.name_servers,
        dnssec: data.dnssec || formatted.domain?.dnssec,
        hasMoreInfo: !!(data.nameServers?.length || data.dnssec || formatted.registrant),
        registrant: formatted.registrant,
        tags: tags
    };
});

// 当组件挂载时加载域名信息
onMounted(async () => {
    if (!domain.value) return;
    
    isLoading.value = true;
    
    try {
        // 使用API工具获取WHOIS数据
        const data = await apiGet(`/api/whois/${encodeURIComponent(domain.value)}`);
        whoisData.value = data;
        
        // 检查是否需要更新URL（如果规范化后的域名与URL中的域名不同）
        if (data.normalizedDomain && data.normalizedDomain !== domain.value) {
            // 更新URL为规范化后的域名
            router.replace(`/${data.normalizedDomain}`);
        }
        
        // 检查是否已收藏
        isFavorited.value = checkFavoriteStatus();
        
    } catch (err) {
        console.error('Failed to fetch WHOIS data:', err);
        error.value = err.message || 'Failed to fetch WHOIS data';
    } finally {
        isLoading.value = false;
    }
});

// 监听域名变化，重新加载数据
watch(domain, (newDomain) => {
    if (newDomain) {
        loadDomainInfo();
    }
});

// 加载域名信息
const loadDomainInfo = async () => {
    if (!domain.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
        // 使用API工具获取WHOIS数据
        const data = await apiGet(`/api/whois/${encodeURIComponent(domain.value)}`);
        whoisData.value = data;
        
        // 检查是否需要更新URL（如果规范化后的域名与URL中的域名不同）
        if (data.normalizedDomain && data.normalizedDomain !== domain.value) {
            // 更新URL为规范化后的域名
            router.replace(`/${data.normalizedDomain}`);
        }
        
        // 检查是否已收藏
        isFavorited.value = checkFavoriteStatus();
    } catch (err) {
        console.error('Failed to fetch WHOIS data:', err);
        error.value = err.message || 'Failed to fetch WHOIS data';
    } finally {
        isLoading.value = false;
    }
};

// 格式化价格
const formatPrice = (price, currency = 'USD') => {
    if (price === undefined || price === null) return '-';

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    });

    return formatter.format(price);
};

// 格式化日期
const formatDate = (dateStr) => {
    if (!dateStr) return '-';

    try {
        return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
    } catch (err) {
        return dateStr;
    }
};

// 复制原始数据
const copyRawData = () => {
    if (!whoisData.value?.data?.rawText) return;

    navigator.clipboard.writeText(whoisData.value.data.rawText)
        .then(() => {
            alert('已复制到剪贴板');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
        });
};

// 下载域名卡片
const downloadCard = () => {
    // TODO: 实现域名卡片生成和下载功能
    alert('域名卡片下载功能尚未实现');
};

// 检查收藏状态
const checkFavoriteStatus = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    isFavorited.value = favorites.includes(domain.value);
};

// 添加到收藏
const addToFavorites = () => {
    if (!domain.value) return;

    const favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    if (!favorites.includes(domain.value)) {
        favorites.push(domain.value);
        localStorage.setItem('favoriteDomains', JSON.stringify(favorites));
        isFavorited.value = true;
    }
};

// 从收藏中移除
const removeFromFavorites = () => {
    if (!domain.value) return;

    let favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    favorites = favorites.filter(d => d !== domain.value);
    localStorage.setItem('favoriteDomains', JSON.stringify(favorites));
    isFavorited.value = false;
};

// toggleRawData函数，切换原始数据显示状态
const toggleRawData = () => {
    showRawData.value = !showRawData.value;
};

onBeforeMount(() => {
    domain.value = route.params.domain as string;
});
</script>

<style lang="scss" scoped>
.whois-result-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;

    .search-input {
        margin-bottom: 2rem;
    }

    .loading-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;

        &.small {
            padding: 1rem;
        }

        .loader {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-left-color: #3498db;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;

            &.small {
                width: 20px;
                height: 20px;
                border-width: 2px;
            }
        }

        .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
    }

    .domain-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;

        h1 {
            font-size: 2rem;
            margin: 0;
        }

        .domain-status {
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;

            &.status-available {
                background-color: #2ecc71;
                color: white;
            }

            &.status-registered {
                background-color: #e74c3c;
                color: white;
            }

            &.status-reserved {
                background-color: #f39c12;
                color: white;
            }
        }
    }

    .formatted-data {
        margin-bottom: 2rem;

        .action-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
    }

    .raw-data {
        background-color: var(--card-bg);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        margin-top: 2rem;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        
        .raw-data-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s;
            
            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            
            .raw-data-title {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .toggle-icon {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: #000;
                font-weight: bold;
                font-size: 1.2rem;
                transition: transform 0.2s;
                
                span {
                    line-height: 1;
                }
            }
        }
        
        .raw-data-content {
            border-top: none;
            
            .raw-data-actions {
                display: flex;
                justify-content: flex-end;
                padding: 0.5rem 1rem;
                background-color: rgba(0, 0, 0, 0.03);
                
                .raw-data-action {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.3rem 0.8rem;
                    background-color: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    
                    &:hover {
                        background-color: var(--primary-color);
                        color: #000;
                        border-color: var(--primary-color);
                    }
                    
                    .material-icons {
                        font-size: 1rem;
                    }
                }
            }
            
            pre {
                margin: 0;
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-all;
                font-family: monospace;
                font-size: 0.85rem;
                background-color: rgba(0, 0, 0, 0.02);
                border-top: 1px solid var(--border-color);
            }
        }
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .whois-result-container {
        .domain-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;

            h1 {
                font-size: 1.5rem;
            }
        }

        .action-buttons {
            flex-direction: column;

            .action-button {
                width: 100%;
            }
        }
    }
}

.domain-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    .domain-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.6rem;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 500;
        background-color: #f0f0f0;
        color: #333;
        cursor: default;

        &.tag-history {
            background-color: #e6f7ff;
            color: #0066cc;
        }

        &.tag-recent {
            background-color: #e6fffb;
            color: #008080;
        }

        &.tag-expiring {
            background-color: #fff2e8;
            color: #d4380d;
        }

        &.tag-renewed {
            background-color: #f6ffed;
            color: #52c41a;
        }

        &.tag-numeric {
            background-color: #f9f0ff;
            color: #722ed1;
        }

        &.tag-short {
            background-color: #fcffe6;
            color: #7cb305;
        }

        &.tag-premium {
            background-color: #fffbe6;
            color: #d48806;
        }

        &.tag-country {
            background-color: #ffe6f7;
            color: #c41d7f;
        }

        &.tag-international {
            background-color: #fff0f6;
            color: #eb2f96;
        }

        &.tag-protected {
            background-color: #f5f5f5;
            color: #595959;
        }

        &.tag-clienthold {
            background-color: #ffccc7;
            color: #cf1322;
        }

        &.tag-transfer {
            background-color: #ffd8bf;
            color: #d46b08;
        }

        &.tag-reserved {
            background-color: #ffe7ba;
            color: #d48806;
        }
    }
}
</style>
