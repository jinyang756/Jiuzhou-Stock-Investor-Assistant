// src/services/stockService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 添加node-fetch依赖用于API请求
import fetch from 'node-fetch';

// 设置全局fetch（如果在Node环境中需要）
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 数据文件路径
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'sina-market-data.json');

// Tushare API配置
const TUSHARE_API_KEY = 'your_api_key_here'; // 替换为实际的Tushare API密钥
const TUSHARE_API_URL = 'https://api.tushare.pro';

/**
 * 调用Tushare API
 * @param {string} apiName - API名称
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} - API响应数据
 */
async function callTushareApi(apiName, params) {
  try {
    const res = await fetch(TUSHARE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_name: apiName,
        token: TUSHARE_API_KEY,
        params: params
      })
    });

    const data = await res.json();

    if (data.code !== 0) {
      throw new Error(`Tushare API错误: ${data.msg}`);
    }

    return data;
  } catch (error) {
    console.error('调用Tushare API错误:', error);
    // 返回模拟数据
    return {
      items: []
    };
  }
}

/**
 * 格式化数字，添加千位分隔符
 * @param {number|string} num - 要格式化的数字
 * @param {number} decimalPlaces - 小数位数
 * @returns {string} - 格式化后的数字
 */
function formatNumber(num, decimalPlaces = 2) {
  if (num === null || num === undefined) return '0';
  const number = parseFloat(num);
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
}

/**
 * 格式化涨跌幅
 * @param {number|string} change - 涨跌幅值
 * @returns {string} - 格式化后的涨跌幅
 */
function formatChange(change) {
  if (change === null || change === undefined) return '0%';
  const num = parseFloat(change);
  if (num > 0) {
    return `+${num.toFixed(2)}%`;
  } else {
    return `${num.toFixed(2)}%`;
  }
}

/**
 * 格式化成交量
 * @param {number|string} volume - 成交量
 * @returns {string} - 格式化后的成交量
 */
function formatVolume(volume) {
  if (volume === null || volume === undefined) return '0亿';
  const num = parseFloat(volume);
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`;
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`;
  } else {
    return num.toString();
  }
}

/**
 * 获取大盘指数数据
 * @returns {Promise<Object>} - 大盘指数数据
 */
async function getMarketIndexData() {
  try {
    // 读取本地JSON文件
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const marketData = JSON.parse(data);

    // 格式化数据
    return {
      shanghaiIndex: formatNumber(marketData.shanghai.point, 2),
      shanghaiChange: formatChange(marketData.shanghai.changeRate),
      shenzhenIndex: formatNumber(marketData.shenzhen.point, 2),
      shenzhenChange: formatChange(marketData.shenzhen.changeRate),
      gemIndex: formatNumber(marketData.gem.point, 2),
      gemChange: formatChange(marketData.gem.changeRate),
      upLimit: 0,
      downLimit: 0,
      totalVolume: 'N/A',
      northInflow: formatNumber(marketData.northCapital.netInflow, 2),
      northInflowRatio: marketData.northCapital.netInflowRatio + '%',
      northUpdateTime: marketData.northCapital.updateTime,
      northNote: marketData.northCapital.note
    };
  } catch (error) {
    console.error('获取大盘指数数据错误:', error);
    // 返回模拟数据，避免页面崩溃
    return {
      shanghaiIndex: '3,231.41',
      shanghaiChange: '+0.53%',
      shenzhenIndex: '2,143.18',
      shenzhenChange: '+0.87%',
      gemIndex: '1,987.25',
      gemChange: '+1.23%',
      upLimit: 0,
      downLimit: 0,
      totalVolume: 'N/A',
      northInflow: '0.00',
      northInflowRatio: '0.00%',
      northUpdateTime: new Date().toLocaleString(),
      northNote: '数据加载失败'
    };
  }
}

/**
 * 获取板块涨幅榜数据
 * @returns {Promise<Array>} - 板块涨幅榜数据
 */
async function getSectorRanks() {
  try {
    const res = await fetch('https://quotes.money.163.com/hs/service/diyrank.php?query=PLATE_ID:1');
    const data = await res.json();
    return data.list.slice(0, 5).map(item => ({
      name: item.SNAME,
      rise: item.CHANGEPERCENT
    }));
  } catch (error) {
    console.error('获取板块涨幅榜数据错误:', error);
    // 返回模拟数据
    return [
      { name: '半导体', rise: 3.25 },
      { name: '新能源', rise: 2.87 },
      { name: '医药', rise: 1.98 },
      { name: '金融', rise: 1.56 },
      { name: '消费', rise: 1.23 }
    ];
  }
}

/**
 * 获取个股快照数据
 * @returns {Promise<Array>} - 个股快照数据
 */
async function getStockSnapshots() {
  try {
    // 使用新浪财经API获取个股数据
    const res = await fetch('https://hq.sinajs.cn/list=sh600000,sz000001,sz300001');
    const data = await res.text();
    
    // 解析返回的文本数据
    const stockData = data.split(';');
    const snapshots = [];
    
    stockData.forEach(item => {
      if (item.trim() === '') return;
      
      // 提取股票代码和名称
      const codeMatch = item.match(/hq_str_(\w+)/);
      if (!codeMatch) return;
      
      const code = codeMatch[1];
      const values = item.split('=')[1].split(',');
      
      if (values.length < 4) return;
      
      const name = values[0];
      const price = parseFloat(values[3]);
      const change = parseFloat(values[3]) - parseFloat(values[2]);
      const changeRate = (change / parseFloat(values[2])) * 100;
      
      snapshots.push({
        code,
        name,
        price: price.toFixed(2),
        change: change.toFixed(2),
        changeRate: changeRate.toFixed(2)
      });
    });
    
    return snapshots;
  } catch (error) {
    console.error('获取个股快照数据错误:', error);
    // 返回模拟数据
    return [
      { code: 'sh600000', name: '浦发银行', price: '8.56', change: '0.12', changeRate: '1.42' },
      { code: 'sz000001', name: '平安银行', price: '12.34', change: '0.23', changeRate: '1.90' },
      { code: 'sz300001', name: '特锐德', price: '25.67', change: '-0.34', changeRate: '-1.31' }
    ];
  }
}
  

/**
 * 获取业绩预增股票
 * @returns {Promise<Array>} - 业绩预增股票列表
 */
async function getPerformanceGrowthStocks() {
  try {
    const data = await callTushareApi('fina_forecast', {
      type: '预增',
      limit: 20
    });

    // 格式化数据
    return data.items.map(item => ({
      code: item[1],
      name: item[2],
      forecastRange: item[6],
      publishDate: item[8]
    }));
  } catch (error) {
    console.error('获取业绩预增股票错误:', error);
    // 返回模拟数据
    return [
      { code: '000001', name: '平安银行', forecastRange: '50%-80%', publishDate: '2023-04-10' },
      { code: '000002', name: '万科A', forecastRange: '30%-50%', publishDate: '2023-04-12' },
      { code: '000063', name: '中兴通讯', forecastRange: '100%-150%', publishDate: '2023-04-15' }
    ];
  }
}

/**
 * 获取股票列表
 * @param {Object} filters - 筛选条件
 * @returns {Promise<Array>} - 股票列表
 */
async function getStocks(filters = {}) {
  try {
    // 构建参数
    const params = {
      limit: 100,
      ...filters
    };

    const data = await callTushareApi('stock_basic', params);

    // 格式化数据
    return data.items.map(item => ({
      code: item[0],
      name: item[1],
      industry: item[2],
      area: item[3]
    }));
  } catch (error) {
    console.error('获取股票列表错误:', error);
    // 返回模拟数据
    return [
      { code: '000001', name: '平安银行', price: '12.56', change: '+2.34%', marketCap: '3,567亿', eventTags: ['业绩预增', '股权激励'] },
      { code: '000002', name: '万科A', price: '18.75', change: '+1.23%', marketCap: '2,890亿', eventTags: ['业绩预增'] },
      { code: '000063', name: '中兴通讯', price: '32.45', change: '+3.56%', marketCap: '1,987亿', eventTags: ['资产重组', '中标合同'] },
      { code: '000100', name: 'TCL科技', price: '4.56', change: '-0.87%', marketCap: '890亿', eventTags: [] },
      { code: '000538', name: '云南白药', price: '56.78', change: '+0.45%', marketCap: '1,234亿', eventTags: ['高送转'] }
    ];
  }
}

// 导出服务方法
export { getMarketIndexData, getPerformanceGrowthStocks, getStocks, getSectorRanks, getStockSnapshots };