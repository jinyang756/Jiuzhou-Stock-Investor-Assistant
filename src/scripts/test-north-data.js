import fetch from 'node-fetch';
import iconv from 'iconv-lite';

async function testNorthData() {
  try {
    const res = await fetch('https://hq.sinajs.cn/list=gb_0', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.sina.com.cn/'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP错误! 状态码: ${res.status}`);
    }
    
    const buffer = await res.arrayBuffer();
    const data = iconv.decode(Buffer.from(buffer), 'gbk');
    console.log('北向资金API响应:');
    console.log(data);
    
    // 解析数据
    const quoteParts = data.split('"');
    console.log('引号包裹的内容:');
    console.log(quoteParts[1]);
    
    const northData = quoteParts[1].split(',');
    console.log('数据项数量:', northData.length);
    console.log('各项数据:');
    northData.forEach((item, index) => {
      console.log(`${index}: ${item}`);
    });
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testNorthData();