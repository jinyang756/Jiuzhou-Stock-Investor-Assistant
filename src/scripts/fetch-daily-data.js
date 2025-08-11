// src/scripts/fetch-daily-data.js
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// 确保数据目录存在
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Tushare API配置
const TUSHARE_BASE_URL = 'https://api.tushare.pro';
const TUSHARE_API_KEY = process.env.TUSHARE_API_KEY || '';

if (!TUSHARE_API_KEY) {
  console.error('TUSHARE_API_KEY 环境变量未设置');
  process.exit(1);
}

/**
 * 调用Tushare API
 */
async function callTushareApi(apiName, params) {
  try {
    const response = await axios.post(TUSHARE_BASE_URL, {
      api_name: apiName,
      token: TUSHARE_API_KEY,
      params: params || {},
      fields: ''
    });

    if (response.data.code !== 0) {
      throw new Error(`Tushare API调用失败: ${response.data.msg}`);
    }

    return response.data.data;
  } catch (error) {
    console.error(`调用Tushare API (${apiName}) 错误:`, error);
    throw error;
  }
}

// 临时测试函数：获取股票基本信息
async function testStockBasicData() {
  try {
    // 获取股票基本信息（前10支）
    const stockBasicData = await callTushareApi('stock_basic', {
      exchange: '',
      list_status: 'L',
      fields: 'ts_code,symbol,name,area,industry,list_date',
      limit: 10
    });

    console.log('股票基本信息获取成功:', stockBasicData);

    // 保存数据到文件
    const dataPath = path.join(dataDir, 'stock-basic.json');
    fs.writeFileSync(dataPath, JSON.stringify(stockBasicData, null, 2));
    console.log('股票基本信息已保存到', dataPath);

    return {
      success: true,
      message: '股票基本信息数据更新成功'
    };
  } catch (error) {
    console.error('股票基本信息获取失败:', error);
    return {
      success: false,
      message: '股票基本信息获取失败: ' + error.message
    };
  }
}

/**
 * 获取并保存大盘指数数据
 */
async function fetchAndSaveMarketData() {
  try {
    // 获取上证指数
    const shanghaiData = await callTushareApi('index_daily', {
      ts_code: '000001.SH',
      limit: 1
    });

    // 获取深证成指
    const shenzhenData = await callTushareApi('index_daily', {
      ts_code: '399001.SZ',
      limit: 1
    });

    // 获取创业板指
    const gemData = await callTushareApi('index_daily', {
      ts_code: '399006.SZ',
      limit: 1
    });

    // 获取涨跌停家数
    const limitData = await callTushareApi('daily_limit', {
      trade_date: shanghaiData.items[0][1]
    });

    // 获取市场总成交量
    const marketData = await callTushareApi('money_flow', {
      trade_date: shanghaiData.items[0][1],
      market: 'SSE'
    });

    // 格式化数据
    const formattedData = {
      date: shanghaiData.items[0][1],
      shanghaiIndex: shanghaiData.items[0][2].toFixed(2),
      shanghaiChange: ((shanghaiData.items[0][8] * 100).toFixed(2)) + '%',
      shenzhenIndex: shenzhenData.items[0][2].toFixed(2),
      shenzhenChange: ((shenzhenData.items[0][8] * 100).toFixed(2)) + '%',
      gemIndex: gemData.items[0][2].toFixed(2),
      gemChange: ((gemData.items[0][8] * 100).toFixed(2)) + '%',
      upLimit: limitData.items ? limitData.items.length : 0,
      downLimit: 0, // 需根据实际API获取
      totalVolume: (marketData.items[0][1] / 100000000).toFixed(2) + '亿'
    };

    // 保存数据
    const dataPath = path.join(dataDir, 'market-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(formattedData, null, 2));
    console.log(`市场数据已保存到 ${dataPath}`);

    return formattedData;
  } catch (error) {
    console.error('获取市场数据错误:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始测试股票基本信息获取...');
    const result = await testStockBasicData();
    console.log(result.message);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();