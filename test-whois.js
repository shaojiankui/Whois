// 测试脚本 - 检查WHOIS API的格式化数据功能
// 使用 node test-whois.js 运行

// 要测试的域名
const testDomains = [
  'google.com',
  'example.com',
  '1.com',
  'microsoft.com'
];

// 测试函数
async function testWhoisAPI() {
  console.log('开始测试WHOIS API格式化数据功能...\n');
  
  for (const domain of testDomains) {
    console.log(`测试域名: ${domain}`);
    
    try {
      const res = await fetch(`http://localhost:3000/api/whois/${domain}`);
      const response = await res.json();
      
      // 检查响应的基本字段
      if (response.domainName) {
        console.log('✅ API请求成功');
        
        if (response.formatted) {
          console.log('✅ 返回了formatted结构');
          
          // 检查formatted的内容
          const formatted = response.formatted;
          
          // 检查域名信息
          if (formatted.domain) {
            console.log('✅ 包含domain信息');
            console.log('   - domain:', formatted.domain.domain || '未提供');
            console.log('   - created_date:', formatted.domain.created_date || '未提供');
            console.log('   - updated_date:', formatted.domain.updated_date || '未提供');
            console.log('   - expired_date:', formatted.domain.expired_date || '未提供');
            
            if (formatted.domain.name_servers && formatted.domain.name_servers.length > 0) {
              console.log('✅ 包含name_servers:', formatted.domain.name_servers.slice(0, 3).join(', ') + 
                         (formatted.domain.name_servers.length > 3 ? '...' : ''));
            } else {
              console.log('➖ 没有name_servers数据');
            }
            
            if (formatted.domain.status && formatted.domain.status.length > 0) {
              console.log('✅ 包含status:', formatted.domain.status.slice(0, 3).join(', ') + 
                         (formatted.domain.status.length > 3 ? '...' : ''));
            } else {
              console.log('➖ 没有status数据');
            }
          } else {
            console.log('❌ 缺少domain信息');
          }
          
          // 检查注册商信息
          if (formatted.registrar) {
            console.log('✅ 包含registrar信息');
            console.log('   - registrar_name:', formatted.registrar.registrar_name || '未提供');
          } else {
            console.log('➖ 没有registrar信息');
          }
          
          // 检查注册人信息
          if (formatted.registrant) {
            console.log('✅ 包含registrant信息');
            console.log('   - name:', formatted.registrant.name || '未提供');
            console.log('   - organization:', formatted.registrant.organization || '未提供');
            console.log('   - email:', formatted.registrant.email || '未提供');
          } else {
            console.log('➖ 没有registrant信息');
          }
          
          if (formatted.administrative) {
            console.log('✅ 包含administrative数据');
          } else {
            console.log('➖ 没有administrative数据');
          }
          
          if (formatted.technical) {
            console.log('✅ 包含technical数据');
          } else {
            console.log('➖ 没有technical数据');
          }
          
          if (formatted.billing) {
            console.log('✅ 包含billing数据');
          } else {
            console.log('➖ 没有billing数据');
          }
        } else {
          console.log('❌ 缺少formatted结构');
          console.log(JSON.stringify(response, null, 2));
        }
      } else {
        console.log('❌ API请求失败:', response.error || '未知错误');
      }
    } catch (error) {
      console.log('❌ 测试错误:', error.message);
    }
    
    console.log('------------------------');
  }
  
  console.log('\n测试完成!');
}

// 运行测试
testWhoisAPI(); 