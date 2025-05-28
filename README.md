# 📘 Nuxt 3 Whois 查询系统设计文档

## 🧭 项目目标

使用Cursor.ai AIDIE提示词结合现代前后端技术栈（Nuxt 3 + Node.js + Redis）开发一个高性能、可扩展、支持国际化与增强功能的域名查询平台。

本Whois查询系统是一个功能完善的域名信息查询平台，支持多种TLD的Whois信息查询、DNS记录查询和域名可用性检查。系统设计了灵活的适配器机制，可以处理不同TLD的查询特点，并实现了缓存和限流机制以提高性能和保护系统。

## 🔧 技术栈
无需过多UI域js框架，尽可能使用少的第三方库，保证占用极小。

| 类型 | 技术 |
|------|------|
| 前端 | Nuxt 3, Vue 3,i18n |
| 服务端 | Nuxt 3 Server Routes |
| 网络 | Whois 协议 (RFC 3912), RDAP (RFC 7480), DNS |
| 缓存 | Redis（用于缓存与限流） |
| 数据存储 | JSON 文件存储、运行时缓存到内存 ，mysql存储历史查询与用户登信息|
| 部署 | Docker, Nginx, PM2, CDN（静态部分） |


## 🔩 系统架构图

```
[用户浏览器]
    ↓
[Nuxt 3 SSR 前端]
    ↓
[Server Routes / Node API]
    ↓
 ┌────────────┐
 │ Whois 查询 │ ← Whois 协议 / RDAP / Web爬取
 └────────────┘
 ┌────────────┐
 │ DNS 查询   │ ← Node.js DNS模块
 └────────────┘
 ┌────────────┐
 │ Redis 缓存 │
 └────────────┘
 ┌──────────────┐
 │ TLD配置 │
 └──────────────┘
```


## 🖥️ 前端（Nuxt 3）

### 核心功能

- 支持全球1200个域名后缀的域名Whois信息查询
- 完全适配不同后缀whois格式的格式化和原始WHOIS数据显示
- whois内日期与当前用户时区转换显示
- 显示域名的溢价，注册续费价格，以及注册状态。
- 显示域名标签，比如是注册10年，区号，即将过期，近期续费等人性化标签。
- 支持DNS记录显示
- 支持生成非常漂亮的域名卡片显示关键信息保存成图片便于用户发送给聊天。
- 查询的时候可以进行域名推荐（结合热点/拼音/行业关键词）
- 批量域名查询，EventSource 实时状态查询反馈
- Rest API 支持（供第三方系统接入）
- 支持亮色域暗色模式切换
- 用户体系，注册登录，找回密码，查询历史查询记录
- 查询历史记录管理（登录后保存）
- 用户的偏好设置管理（登录后保存到数据库，否则存到浏览器）
- 域名whois tld信息的增删改查(超级管理员用户)
- 用户信息管理(超级管理员用户)
- 登录后可以收藏域名 / 加入观察清单，后端定时查询域名可用状态系统内以及邮件推送。

### 用户界面需求
1. **响应式设计**
   - 支持PC与移动设备的响应式适配
   - 关键功能的特殊移动布局
2. **搜索组件**
   - 用于域名查询的粘性搜索栏
   - 常见任务的快速操作按钮
3. **结果显示**
   - WHOIS信息的格式化显示
   - 原始数据切换选项

### 页面路由结构

- `/` 首页 + 查询输入框
- `/xxx.com` 查询结果页面
- `/bulk-check` 批量查询页面
- `/tld-list` 支持的TLD展示
- `/dns` DNS查询

### 核心组件

- `<DomainInput />`：域名输入 + 自动补全 + 语法校验
- `<WhoisResult />`：Whois数据展示,支持元数据域格式化数据切换
- `<DNSResult />`：DNS记录显示表格


## 🌐 国际化支持（i18n）

- 默认支持中/英双语
- 支持用户语言自动识别及切换


## ⚡ 性能优化

- Redis缓存提升重复查询响应速度
- Nuxt3 SSR 提升首屏渲染速度
- DNS 和 Whois 查询请求并发处理（Promise.all）



## 后端接口设计

### 1. 查询

- `/api/whois/xxx.com`
  - Whois / RDAP / Web 抓取自动适配
- `/api/dns/xxx.com`
  - A/AAAA/MX/NS/SOA/TXT/CNAME 查询
- `/api/available/xxx.com`
  - 可注册/已注册/保留状态判断

### 2. 用户

- `/api/user/login`
- `/api/user/register`
- `/api/user/resetpassword`
- `/api/user/history`
- `/api/user/setting`
- `/api/user/favorite`
。。。。

### 3. 翻译

- `/api/translate`
    - 接入 DeepL / 百度翻译 API
    - 支持多语言自动检测与翻译 Whois 文本字段

### 4. TLD查询与信息维护

- `/api/tld/list`
- `/api/admin/tld/modiy`
- `/api/admin/tld/add`

### 5. 用户信息管理
- `/api/admin/user/list`
- `/api/admin/user/modiy`
- `/api/admin/user/add`

## 后端模块设计
### 1. 缓存
- Redis 实现：
  - 查询结果缓存（域名 + 类型）
  - IP 限流数据（Token Bucket 算法）
  - 请求频率控制（每分钟、每天）

### 2.TLD动态管理机制

- 增加TLD配置热更新接口（无需重启服务）
- 设计TLD校验规则模板系统（正则表达式+自定义处理器）
- TLD智能解析适配器机制细化
    - 解析器灵活，可适配全部后缀域名解析
    - 每个 TLD 可以单独挂载：
        - 自定义 parseHandler（解析器函数）
        - 自定义 queryHandler（查询器，支持 TCP/RDAP/Web）
        - 可以支持 fallback，例如优先传统 Whois，失败再回到RDAP

#### 3. TLD存储

- `tld数据表` 
- TLD -> whois server / keyword pattern / 分组


#### 4. 自动任务（定时器）
- 通过 node-cron 等方式：
- 定期检测用户收藏域名状态
- 清理过期缓存
- 推送“域名即将释放”等通知

### 5. 限流与安全控制

- IP 黑白名单配置
- 每 IP 每分钟 & 每天访问限制
- Redis 中存储限流状态
- Option：加入验证码/图形识别/Token机制提升防刷能力

## 错误处理机制

- 后端 API 的统一错误处理规范
- 错误码定义（如4001参数错误，4002非法域名，5001查询失败等）
- 错误日志记录，如果出现查询报错console.log出来，后续pm2管理日志。

### 鉴权与权限控制
- 普通用户与超级管理员权限区分
- API 路由中间件拦截判断

## 部署

### 前端

- `npm run build` 构建后使用 `node .output/server/index.mjs` 启动
- Nginx 反向代理 + SSL
- CDN 处理静态内容（图片/JS/CSS）

### 后端

- Redis 容器 + API 容器（Docker Compose）
- 可拆分为：
  - Nuxt SSR 容器
  - API 容器（独立 Node 服务）

### 容器化建议

```yaml
version: '3'
services:
  whois-web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - redis
  redis:
    image: redis:latest
```
