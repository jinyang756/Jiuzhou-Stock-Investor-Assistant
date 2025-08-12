import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import iconv from 'iconv-lite';

// 日志输出函数（带时间戳）
const log = (message) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../../public/data/sina-market-data.json');

async function fetchSinaData() {
  try {
    log('开始拉取新浪财经数据...');
    
    // 拉取上证指数（新浪接口）
    log('请求上证指数数据：https://hq.sinajs.cn/list=s_sh000001');
    const shRes = await fetch('https://hq.sinajs.cn/list=s_sh000001', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    
    if (!shRes.ok) {
      throw new Error(`请求失败，状态码：${shRes.status}`);
    }
    
    log('上证指数数据请求成功，开始解析...');
    const shBuffer = await shRes.buffer();
    const shRawData = iconv.decode(shBuffer, 'gbk'); // 原始响应内容
    log(`原始响应内容：${shRawData.slice(0, 100)}...`); // 打印前100字符
    
    const shData = shRawData.split('"')[1]?.split(',');
    if (!shData || shData.length < 3) {
      throw new Error('数据解析失败，格式不符合预期');
    }
    
    // 组装数据
    const result = {
      sh: { 
        index: parseFloat(shData[1]), 
        change: parseFloat(shData[2]) 
      },
      north: { 
        netInflow: 52.3,
        rate: '3.2%' 
      },
      limitUp: 48,
      updateTime: new Date().toLocaleTimeString()
    };
    log(`解析后的数据：${JSON.stringify(result, null, 2)}`);
    
    // 保存数据
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    log(`数据已成功保存到：${outputPath}`);
    
  } catch (error) {
    log(`❌ 执行失败：${error.message}`);
    log(`错误详情：${error.stack}`);
  }
}

fetchSinaData();
