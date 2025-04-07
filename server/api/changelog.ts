import { ResponseData } from '../utils/response';
import type { H3Event } from 'h3';

/**
 * 将Markdown转换为HTML的简单处理函数
 * 由于没有marked库，我们只做基本的Markdown到HTML转换
 */
function simpleMarkdownToHtml(markdown: string): string {
  // 首先清理连续的多余空行，保留单个换行
  const cleanedMarkdown = markdown
    .replace(/\n{3,}/g, '\n\n');
  
  // 将markdown转换为HTML
  let html = cleanedMarkdown
    // 将h1标题转换为HTML
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    // 将h2标题转换为HTML
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    // 将h3标题转换为HTML
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    // 将h4标题转换为HTML
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    
  // 专门为元数据键添加特殊样式（例如 - **解决方案**:）
  html = html.replace(/- \*\*([^*:]+)\*\*:/gm, (match, key) => {
    return `- <span class="metadata-key">${key}:</span>`;
  });
  
  // 继续处理其他Markdown元素
  html = html
    // 将**文本**转换为粗体
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // 将*文本*转换为斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 将`代码`转换为内联代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 将代码块转换为预格式化文本
    .replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>')
    // 将段落转换为p标签 - 优化以减少连续的段落标签
    .replace(/^(?!<[h|p|u|o|c])(.*\w.*)$/gm, '<p>$1</p>')
    // 替换连续的<p></p>标签，减少空白段落
    .replace(/<p>\s*<\/p>\s*<p>/g, '<p>')
    // 删除行尾空白，优化空白处理
    .replace(/\s+$/gm, '')
    // 处理列表
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, (match) => `<ul>${match}</ul>`)
    // 优化最终的HTML，减少不必要的空白
    .replace(/>\s+</g, '><')
    // 添加适当的空白以保持可读性但不过度
    .replace(/<\/h([1-4])><h/g, '</h$1>\n<h')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/<\/ul><p>/g, '</ul>\n<p>')
    .replace(/<\/p><ul>/g, '</p>\n<ul>');
  
  // 添加元数据标签的CSS样式
  const css = `
  <style>
    .metadata-key {
      color: var(--primary-color, #11FCD4);
      font-weight: bold;
      font-size: 1.05em;
      background-color: rgba(17, 252, 212, 0.08);
      padding: 2px 5px;
      border-radius: 3px;
      margin-right: 5px;
    }
  </style>`;
  
  return html + css;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // 获取当前请求的主机和协议
    const headers = getRequestHeaders(event);
    const host = headers.host || 'localhost:3000';
    const protocol = headers['x-forwarded-proto'] || 'http';
    
    // 构建Note.md的URL
    const noteUrl = `${protocol}://${host}/_Note.md`;
    
    // 通过HTTP请求获取Note.md内容
    const response = await fetch(noteUrl);
    
    if (!response.ok) {
      throw new Error(`获取更新日志失败: ${response.status} ${response.statusText}`);
    }
    
    const fileContent = await response.text();
    
    // 将Markdown转换为HTML
    const htmlContent = simpleMarkdownToHtml(fileContent);
    
    // 返回HTML内容
    return ResponseData.success({
      content: htmlContent
    }, '成功获取更新日志');
  } catch (error: any) {
    console.error('获取更新日志时出错:', error);
    return ResponseData.error('无法获取更新日志', error.message);
  }
}); 