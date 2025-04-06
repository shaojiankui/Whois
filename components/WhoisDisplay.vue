<template>
    <div class="whois-display">
        <!-- 将按钮区域移到组件顶部右侧 -->
        <div class="action-buttons">
            <button class="action-btn" @click="downloadCard" :title="$t('whois.downloadCard')">
                ↓
            </button>

            <button class="action-btn" @click="toggleMetadata" :title="$t('whois.toggleMetadata')">
                ℹ️
            </button>
            <button class="action-btn" @click="addToFavorites" v-if="!isFavorited" :title="$t('whois.saveToFavorites')">
                ☆
            </button>
            <button class="action-btn" @click="removeFromFavorites" v-else :title="$t('whois.removeFromFavorites')">
                ★
            </button>
        </div>
        <div class="whois-content">


            <!-- 域名注册信息 -->
            <div class="info-row" v-if="data.expirationDate">
                <div class="info-label">{{ $t('whois.expirationDate') }}:</div>
                <div class="info-value">{{ data.expirationDate }}</div>
            </div>

            <div class="info-row" v-if="data.updatedDate">
                <div class="info-label">{{ $t('whois.updatedDate') }}:</div>
                <div class="info-value">{{ data.updatedDate }}</div>
            </div>

            <div class="info-row" v-if="data.creationDate">
                <div class="info-label">{{ $t('whois.creationDate') }}:</div>
                <div class="info-value">{{ data.creationDate }}</div>
            </div>

            <!-- 域名状态 -->
            <div class="info-row" v-if="data.domainStatus && Object.keys(data.domainStatus).length > 0">
                <div class="info-label">{{ $t('whois.domainStatus') }}:</div>
                <div class="info-value status">
                    <div v-for="(description, status) in data.domainStatus" :key="status" class="status-item">
                        <div class="status-name">{{ status }}</div>
                        <div class="status-description" v-if="description">({{ description }})</div>
                    </div>
                </div>
            </div>

            <!-- 注册商信息 -->
            <div class="info-row" v-if="data.sponsoringRegistrar">
                <div class="info-label">{{ $t('whois.sponsoringRegistrar') }}:</div>
                <div class="info-value">{{ data.sponsoringRegistrar }}</div>
            </div>

            <div class="info-row" v-if="data.registrarIANAID">
                <div class="info-label">{{ $t('whois.registrarIANAID') }}:</div>
                <div class="info-value">{{ data.registrarIANAID }}</div>
            </div>

            <div class="info-row" v-if="data.registryDomainID">
                <div class="info-label">{{ $t('whois.registryDomainID') }}:</div>
                <div class="info-value">{{ data.registryDomainID }}</div>
            </div>

            <!-- 名称服务器 -->
            <div class="info-row" v-if="data.nameServers && data.nameServers.length > 0">
                <div class="info-label">{{ $t('whois.nameservers') }}:</div>
                <div class="info-value">
                    <ul class="nameservers-list">
                        <li v-for="(ns, index) in data.nameServers" :key="index">{{ ns }}</li>
                    </ul>
                </div>
            </div>

            <!-- DNSSEC -->
            <div class="info-row" v-if="data.dnssec">
                <div class="info-label">DNSSEC:</div>
                <div class="info-value">{{ data.dnssec }}</div>
            </div>

            <!-- 联系人信息 -->
            <div v-if="showRegistrantInfo && data.registrant">
                <h3 class="section-title">{{ $t('whois.registrantInfo') }}</h3>

                <div class="info-row" v-if="data.registrant.name">
                    <div class="info-label">{{ $t('whois.name') }}:</div>
                    <div class="info-value">{{ data.registrant.name }}</div>
                </div>

                <div class="info-row" v-if="data.registrant.organization">
                    <div class="info-label">{{ $t('whois.organization') }}:</div>
                    <div class="info-value">{{ data.registrant.organization }}</div>
                </div>

                <div class="info-row" v-if="data.registrant.email">
                    <div class="info-label">{{ $t('whois.email') }}:</div>
                    <div class="info-value">{{ data.registrant.email }}</div>
                </div>

                <div class="info-row" v-if="data.registrant.phone">
                    <div class="info-label">{{ $t('whois.phone') }}:</div>
                    <div class="info-value">{{ data.registrant.phone }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WhoisDisplayData, WhoisContact } from '~/types/whois';

const { t } = useI18n();

// 定义组件属性
const props = defineProps({
    domain: {
        type: String,
        required: true
    },
    data: {
        type: Object as () => WhoisDisplayData,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    showRegistrantInfo: {
        type: Boolean,
        default: false
    }
});

// 收藏状态
const isFavorited = ref(false);

// 检查收藏状态
const checkFavoriteStatus = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    isFavorited.value = favorites.includes(props.domain);
};

// 添加到收藏
const addToFavorites = () => {
    if (!props.domain) return;

    const favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    if (!favorites.includes(props.domain)) {
        favorites.push(props.domain);
        localStorage.setItem('favoriteDomains', JSON.stringify(favorites));
        isFavorited.value = true;
    }
};

// 从收藏中移除
const removeFromFavorites = () => {
    if (!props.domain) return;

    let favorites = JSON.parse(localStorage.getItem('favoriteDomains') || '[]');
    favorites = favorites.filter(d => d !== props.domain);
    localStorage.setItem('favoriteDomains', JSON.stringify(favorites));
    isFavorited.value = false;
};

// 下载域名卡片
const downloadCard = () => {
    // TODO: 实现域名卡片生成和下载功能
    alert('域名卡片下载功能尚未实现');
};



// 控制展开/折叠状态
const expanded = ref(false);

// 初始化检查收藏状态
checkFavoriteStatus();
</script>

<style lang="scss" scoped>
.whois-display {
    width: 100%;
    background-color: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    position: relative;
    /* 添加相对定位，使按钮可以绝对定位 */

    .whois-header {
        padding: 1rem;
        border-bottom: 1px solid #2f2f2f;

        h2 {
            margin: 0;
            font-size: 1.4rem;
            color: #ffffff;
            font-weight: 600;
        }
    }

    .whois-content {
        padding: 1rem;

        .info-row {
            display: flex;
            padding: 0.6rem 0;
            // border-bottom: 1px solid #2f2f2f;

            &:last-child {
                border-bottom: none;
            }

            .info-label {
                flex: 0 0 220px;
                font-weight: 500;
                color: #a0a0a0;
            }

            .info-value {
                flex: 1;
                color: #ffffff;

                &.status {
                    .status-item {
                        display: flex;
                        align-items: baseline;
                        margin-bottom: 0.4rem;

                        .status-name {
                            font-weight: 500;
                        }

                        .status-description {
                            margin-left: 0.5rem;
                            color: #a0a0a0;
                            font-size: 0.9em;
                        }
                    }
                }
            }
        }

        .nameservers-list {
            list-style-type: none;
            padding: 0;
            margin: 0;

            li {
                margin-bottom: 0.4rem;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }

        .expand-button {
            cursor: pointer;
            color: #3498db;
            text-align: center;
            padding: 0.6rem 0;
            transition: all 0.2s;

            &:hover {
                color: #2980b9;
            }

            .arrow-down {
                font-size: 0.8rem;
            }
        }

        .additional-info {
            margin-top: 1rem;
            border-top: 1px solid #2f2f2f;
            padding-top: 1rem;

            .section-title {
                font-size: 1.1rem;
                margin: 1rem 0 0.5rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #2f2f2f;
                color: #ffffff;
            }
        }

        .metadata-section {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #2f2f2f;

            .raw-data {
                background-color: #111;
                padding: 0.75rem;
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.85rem;
                white-space: pre-wrap;
                word-break: break-all;
                max-height: 200px;
                overflow-y: auto;
            }
        }
    }
}

@media (max-width: 768px) {
    .whois-display {
        .whois-content {
            .info-row {
                flex-direction: column;
                padding: 0.8rem 0;

                .info-label {
                    flex: none;
                    margin-bottom: 0.3rem;
                }
            }
        }
    }
}

.action-buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 0.5rem;
    z-index: 10;
}

.action-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: rgba(42, 42, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    &:hover {
        background-color: rgba(58, 58, 58, 0.9);
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.2);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
}
</style>