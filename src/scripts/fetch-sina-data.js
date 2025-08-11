// src/scripts/fetch-sina-data.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import iconv from 'iconv-lite';

dotenv.config();

// 确保数据目录存在
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * 获取新浪财经API数据
 */
async function fetchSinaData() {
  try {
    // 获取上证指数数据
    const shanghaiData = await getSinaIndex('s_sh000001');
    console.log('上证指数数据获取成功:', shanghaiData);

    // 获取深证成指数据
    const shenzhenData = await getSinaIndex('s_sz399001');
    console.log('深证成指数据获取成功:', shenzhenData);

    // 获取创业板指数据
    const gemData = await getSinaIndex('s_sz399006');
    console.log('创业板指数据获取成功:', gemData);

    // 获取北向资金数据
    const northData = await getNorthCapital();
    console.log('北向资金数据获取成功:', northData);

    // 组合数据
    const marketData = {
      date: new Date().toLocaleDateString(),
      shanghai: shanghaiData,
      shenzhen: shenzhenData,
      gem: gemData,
      northCapital: northData
    };

    // 保存数据
    const dataPath = path.join(dataDir, 'sina-market-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(marketData, null, 2));
    console.log(`市场数据已保存到 ${dataPath}`);

    return {
      success: true,
      message: '新浪财经数据更新成功'
    };
  } catch (error) {
    console.error('新浪财经数据更新失败:', error);
    return {
      success: false,
      message: '新浪财经数据更新失败: ' + error.message
    };
  }
}

/**
 * 获取新浪指数数据
 */
async function getSinaIndex(indexCode) {
  const url = `https://hq.sinajs.cn/list=${indexCode}`;
  try {
    // 添加模拟浏览器的请求头，并设置responseType为arraybuffer以正确处理编码
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://finance.sina.com.cn/'
      },
      responseType: 'arraybuffer'
    });
    // 使用iconv-lite将GBK编码转换为UTF-8
    const dataStr = iconv.decode(response.data, 'GBK');
    // 解析新浪API返回的数据
    // 格式示例: var hq_str_s_sh000001="上证指数,3370.13,10.88,0.32,356153,4185516";
    const match = dataStr.match(/"([^\"]+)"/);
    if (!match) {
      throw new Error(`无法解析指数 ${indexCode} 数据`);
    }
    const data = match[1].split(',');
    return {
      name: data[0],
      point: data[1],  // 最新点位
      change: data[2],  // 涨跌额
      changeRate: data[3]  // 涨跌幅(%)
    };
  } catch (error) {
    console.error(`获取指数 ${indexCode} 失败:`, error);
    throw new Error(`获取指数 ${indexCode} 失败: ${error.message}`);
  }
}

/**
 * 获取北向资金数据
 */
async function getNorthCapital() {
  // 尝试使用Tushare API获取北向资金数据
  const tushareToken = process.env.TUSHARE_TOKEN;
  if (!tushareToken) {
    console.warn('TUSHARE_TOKEN未配置，无法获取北向资金数据');
    return {
      netInflow: '0',
      netInflowRatio: '0',
      shNetInflow: '0',
      szNetInflow: '0',
      updateTime: new Date().toLocaleString(),
      note: '未配置Tushare Token'
    };
  }

  try {
    const url = 'http://api.tushare.pro';
    const response = await axios.post(url, {
      api_name: 'moneyflow_hsgt',
      token: tushareToken,
      params: {
        trade_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        market_type: '北向'
      },
      fields: 'trade_date, north_money, sh_money, sz_money, north_rate'
    });

    if (response.data.code !== 0) {
      console.error('Tushare API错误:', response.data.msg);
      return {
        netInflow: '0',
        netInflowRatio: '0',
        shNetInflow: '0',
        szNetInflow: '0',
        updateTime: new Date().toLocaleString(),
        note: 'Tushare API错误: ' + response.data.msg
      };
    }

    const data = response.data.data.items[0];
    if (!data) {
      return {
        netInflow: '0',
        netInflowRatio: '0',
        shNetInflow: '0',
        szNetInflow: '0',
        updateTime: new Date().toLocaleString(),
        note: '今日无数据'
      };
    }

    return {
      netInflow: (data.north_money / 10000).toFixed(2), // 转换为亿元
      netInflowRatio: data.north_rate ? data.north_rate.toFixed(2) : '0',
      shNetInflow: (data.sh_money / 10000).toFixed(2), // 转换为亿元
      szNetInflow: (data.sz_money / 10000).toFixed(2), // 转换为亿元
      updateTime: new Date().toLocaleString(),
      note: '数据来源于Tushare'
    };
  } catch (error) {
    console.error('获取北向资金数据失败:', error.message);
    // 使用默认数据
    return {
      netInflow: '0',
      netInflowRatio: '0',
      shNetInflow: '0',
      szNetInflow: '0',
      updateTime: new Date().toLocaleString(),
      note: '获取数据失败: ' + error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始更新新浪财经数据...');
  const result = await fetchSinaData();
  console.log(result.message);
  if (!result.success) {
    process.exit(1);
  }
}

// 执行主函数
main();