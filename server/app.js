const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
// 修复端口冲突 - 添加端口检测
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// 增强的CORS配置
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:3001',
    // 生产环境的域名，根据实际情况修改
    process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件服务
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    // 为静态文件添加缓存头
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// 直接提供CSV文件访问 - 修复部署问题的关键配置
app.get('/zici.csv', (req, res) => {
  const csvPath = path.join(__dirname, '../zici.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(csvPath);
});

// 用户数据目录
const USER_DATA_DIR = path.join(__dirname, 'user_data');
const CSV_FILE_PATH = path.join(__dirname, '../zici.csv');

// 确保用户数据目录存在
async function ensureUserDataDir() {
  try {
    await fs.access(USER_DATA_DIR);
  } catch {
    await fs.mkdir(USER_DATA_DIR, { recursive: true });
    console.log('创建用户数据目录:', USER_DATA_DIR);
  }
}

// 汉字转拼音函数（简化版）
function chineseToPinyin(chinese) {
  // 简化的汉字转拼音映射表（常用字）
  const pinyinMap = {
    '张': 'zhang', '王': 'wang', '李': 'li', '赵': 'zhao', '陈': 'chen',
    '刘': 'liu', '杨': 'yang', '黄': 'huang', '周': 'zhou', '吴': 'wu',
    '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu',
    '郭': 'guo', '何': 'he', '高': 'gao', '林': 'lin', '罗': 'luo',
    '郑': 'zheng', '梁': 'liang', '谢': 'xie', '宋': 'song', '唐': 'tang',
    '许': 'xu', '韩': 'han', '冯': 'feng', '邓': 'deng', '曹': 'cao',
    '彭': 'peng', '曾': 'zeng', '萧': 'xiao', '田': 'tian', '董': 'dong',
    '潘': 'pan', '袁': 'yuan', '于': 'yu', '蒋': 'jiang', '蔡': 'cai',
    '余': 'yu', '杜': 'du', '叶': 'ye', '程': 'cheng', '苏': 'su',
    '魏': 'wei', '吕': 'lv', '丁': 'ding', '任': 'ren', '沈': 'shen',
    '姚': 'yao', '卢': 'lu', '姜': 'jiang', '崔': 'cui', '钟': 'zhong',
    '谭': 'tan', '陆': 'lu', '汪': 'wang', '范': 'fan', '金': 'jin',
    '石': 'shi', '廖': 'liao', '贾': 'jia', '夏': 'xia', '韦': 'wei',
    '付': 'fu', '方': 'fang', '白': 'bai', '邹': 'zou', '孟': 'meng',
    '熊': 'xiong', '秦': 'qin', '邱': 'qiu', '江': 'jiang', '尹': 'yin',
    '薛': 'xue', '闫': 'yan', '段': 'duan', '雷': 'lei', '侯': 'hou',
    '龙': 'long', '史': 'shi', '陶': 'tao', '黎': 'li', '贺': 'he',
    '顾': 'gu', '毛': 'mao', '郝': 'hao', '龚': 'gong', '邵': 'shao',
    '万': 'wan', '钱': 'qian', '严': 'yan', '覃': 'qin', '武': 'wu',
    '戴': 'dai', '莫': 'mo', '孔': 'kong', '向': 'xiang', '汤': 'tang',
    '小': 'xiao', '明': 'ming', '华': 'hua', '红': 'hong', '军': 'jun',
    '强': 'qiang', '磊': 'lei', '洋': 'yang', '勇': 'yong', '艳': 'yan',
    '娟': 'juan', '秀': 'xiu', '英': 'ying', '敏': 'min', '芳': 'fang',
    '娜': 'na', '静': 'jing', '丽': 'li', '美': 'mei', '亚': 'ya',
    '伟': 'wei', '峰': 'feng', '超': 'chao', '鹏': 'peng', '涛': 'tao',
    '平': 'ping', '刚': 'gang', '桂': 'gui', '娇': 'jiao', '兰': 'lan',
    '凤': 'feng', '洁': 'jie', '梅': 'mei', '琳': 'lin', '素': 'su',
    '云': 'yun', '莲': 'lian', '真': 'zhen', '环': 'huan', '雪': 'xue',
    '荣': 'rong', '爱': 'ai', '妹': 'mei', '霞': 'xia', '香': 'xiang',
    '月': 'yue', '莺': 'ying', '媛': 'yuan', '艳': 'yan', '瑞': 'rui',
    '凡': 'fan', '佳': 'jia', '嘉': 'jia', '琼': 'qiong', '勤': 'qin',
    '珍': 'zhen', '贞': 'zhen', '莉': 'li', '桂': 'gui', '娣': 'di',
    '叶': 'ye', '璧': 'bi', '璐': 'lu', '娅': 'ya', '琦': 'qi',
    '晶': 'jing', '妍': 'yan', '茜': 'qian', '秋': 'qiu', '珊': 'shan',
    '莎': 'sha', '锦': 'jin', '黛': 'dai', '青': 'qing', '倩': 'qian',
    '婷': 'ting', '姣': 'jiao', '婉': 'wan', '娴': 'xian', '瑾': 'jin',
    '颖': 'ying', '露': 'lu', '瑶': 'yao', '怡': 'yi', '婵': 'chan',
    '雁': 'yan', '蓓': 'bei', '纨': 'wan', '仪': 'yi', '荷': 'he',
    '丹': 'dan', '蓉': 'rong', '眉': 'mei', '君': 'jun', '琴': 'qin',
    '蕊': 'rui', '薇': 'wei', '菁': 'jing', '梦': 'meng', '岚': 'lan',
    '苑': 'yuan', '婕': 'jie', '馨': 'xin', '瑗': 'yuan', '琰': 'yan',
    '韵': 'yun', '融': 'rong', '园': 'yuan', '艺': 'yi', '咏': 'yong',
    '卿': 'qing', '聪': 'cong', '澜': 'lan', '纯': 'chun', '毓': 'yu',
    '悦': 'yue', '昭': 'zhao', '冰': 'bing', '爽': 'shuang', '琬': 'wan',
    '茗': 'ming', '羽': 'yu', '希': 'xi', '欣': 'xin', '飘': 'piao',
    '育': 'yu', '滢': 'ying', '馥': 'fu', '筠': 'yun', '柔': 'rou',
    '竹': 'zhu', '霭': 'ai', '凝': 'ning', '晓': 'xiao', '欢': 'huan',
    '霄': 'xiao', '枫': 'feng', '芸': 'yun', '菲': 'fei', '寒': 'han',
    '伊': 'yi', '亚': 'ya', '宜': 'yi', '可': 'ke', '姬': 'ji'
  };
  
  let result = '';
  for (let char of chinese) {
    result += pinyinMap[char] || char.toLowerCase();
  }
  return result;
}

// 生成用户文件名
function generateUserFileName(name, studentId) {
  const pinyin = chineseToPinyin(name);
  return `${pinyin}_${studentId}.json`;
}

// API路由

// 获取所有用户列表
app.get('/api/users', async (req, res) => {
  try {
    const files = await fs.readdir(USER_DATA_DIR);
    const userFiles = files.filter(file => file.endsWith('.json'));
    
    const users = [];
    for (const file of userFiles) {
      try {
        const filePath = path.join(USER_DATA_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const userData = JSON.parse(content);
        
        users.push({
          fileName: file,
          name: userData.userInfo?.name || '未知',
          studentId: userData.userInfo?.studentId || '000',
          lastActivity: userData.userInfo?.lastActivity || new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error reading user file ${file}:`, error);
      }
    }
    
    // 按最后活动时间排序
    users.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 创建或获取用户数据
app.post('/api/user', async (req, res) => {
  try {
    const { name, studentId } = req.body;
    
    if (!name || !studentId) {
      return res.status(400).json({ error: '姓名和学号不能为空' });
    }
    
    const fileName = generateUserFileName(name, studentId);
    const filePath = path.join(USER_DATA_DIR, fileName);
    
    let userData;
    
    try {
      // 尝试读取现有文件
      const content = await fs.readFile(filePath, 'utf8');
      userData = JSON.parse(content);
      
      // 更新最后活动时间
      userData.userInfo.lastActivity = new Date().toISOString();
    } catch (error) {
      // 文件不存在，创建新用户
      userData = {
        userInfo: {
          name,
          studentId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        },
        learningRecords: {},
        userStats: {
          总学习汉字数: 0,
          总掌握汉字数: 0,
          整体正确率: 0,
          学习天数: 0,
          连续学习天数: 0,
          本周学习天数: 0,
          平均学习时长: 0
        },
        settings: {
          学习数量: 10,
          复习数量: 15,
          检查类型: '混合模式',
          学习范围: '全新汉字',
          是否显示声调: true,
          是否显示笔画: false,
          倒计时秒数: 30,
          起始序号: 1
        },
        favoriteChars: [],
        appSettings: {
          themeColor: 'blue',
          fontSize: 'normal',
          dailyReminder: false,
          reminderTime: '19:00',
          dailyGoal: 10
        }
      };
    }
    
    // 保存用户数据
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');
    
    res.json({
      success: true,
      fileName,
      userData
    });
  } catch (error) {
    console.error('Error creating/getting user:', error);
    res.status(500).json({ error: '用户操作失败' });
  }
});

// 保存用户数据
app.put('/api/user/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const userData = req.body;
    
    // 更新最后活动时间
    if (userData.userInfo) {
      userData.userInfo.lastActivity = new Date().toISOString();
    }
    
    const filePath = path.join(USER_DATA_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: '保存用户数据失败' });
  }
});

// 删除用户
app.delete('/api/user/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(USER_DATA_DIR, fileName);
    
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 保存错字本数据
app.post('/api/user/:fileName/errorbook', async (req, res) => {
  try {
    const { fileName } = req.params;
    const errorBookData = req.body;
    
    // 生成错字本文件名
    const baseFileName = fileName.replace('.json', '');
    const errorBookFileName = `${baseFileName}_errorbook.json`;
    const filePath = path.join(USER_DATA_DIR, errorBookFileName);
    
    await fs.writeFile(filePath, JSON.stringify(errorBookData, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving error book:', error);
    res.status(500).json({ error: '保存错字本失败' });
  }
});

// 加载错字本数据
app.get('/api/user/:fileName/errorbook', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // 生成错字本文件名
    const baseFileName = fileName.replace('.json', '');
    const errorBookFileName = `${baseFileName}_errorbook.json`;
    const filePath = path.join(USER_DATA_DIR, errorBookFileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const errorBookData = JSON.parse(content);
      res.json(errorBookData);
    } catch (fileError) {
      // 文件不存在，返回空数组
      res.json([]);
    }
  } catch (error) {
    console.error('Error loading error book:', error);
    res.status(500).json({ error: '加载错字本失败' });
  }
});

// CSV文件读取函数
async function readCSVData() {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('fs').createReadStream(CSV_FILE_PATH);
    
    stream
      .pipe(csv({
        headers: ['序号', '汉字', '拼音', '词语1', '词语2', '词语3'],
        skipEmptyLines: true
      }))
      .on('data', (data) => {
        // 跳过标题行和确保序号是有效数字
        const sequence = parseInt(data.序号);
        if (!isNaN(sequence) && data.汉字 && data.汉字 !== '汉字') {
          results.push({
            序号: sequence,
            汉字: data.汉字,
            拼音: data.拼音 || '',
            词语1: data.词语1 || '',
            词语2: data.词语2 || '',
            词语3: data.词语3 || ''
          });
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
}

// CSV文件写入函数
async function writeCSVData(data) {
  const csvWriter = createCsvWriter({
    path: CSV_FILE_PATH,
    header: [
      { id: '序号', title: '序号' },
      { id: '汉字', title: '汉字' },
      { id: '拼音', title: '拼音' },
      { id: '词语1', title: '词语1' },
      { id: '词语2', title: '词语2' },
      { id: '词语3', title: '词语3' }
    ]
  });
  
  await csvWriter.writeRecords(data);
}

// 获取所有汉字数据
app.get('/api/hanzi', async (req, res) => {
  try {
    const hanziData = await readCSVData();
    res.json({
      success: true,
      data: hanziData,
      total: hanziData.length
    });
  } catch (error) {
    console.error('读取汉字数据失败:', error);
    res.status(500).json({
      success: false,
      message: '读取汉字数据失败'
    });
  }
});

// 获取单个汉字数据
app.get('/api/hanzi/:sequence', async (req, res) => {
  try {
    const sequence = parseInt(req.params.sequence);
    if (isNaN(sequence)) {
      return res.status(400).json({
        success: false,
        message: '序号必须是数字'
      });
    }
    
    const hanziData = await readCSVData();
    const hanzi = hanziData.find(item => item.序号 === sequence);
    
    if (!hanzi) {
      return res.status(404).json({
        success: false,
        message: '未找到指定汉字'
      });
    }
    
    res.json({
      success: true,
      data: hanzi
    });
  } catch (error) {
    console.error('读取汉字数据失败:', error);
    res.status(500).json({
      success: false,
      message: '读取汉字数据失败'
    });
  }
});

// 更新汉字数据
app.put('/api/hanzi/:sequence', async (req, res) => {
  try {
    const sequence = parseInt(req.params.sequence);
    if (isNaN(sequence)) {
      return res.status(400).json({
        success: false,
        message: '序号必须是数字'
      });
    }
    
    const { 拼音, 词语1, 词语2, 词语3 } = req.body;
    
    // 读取现有数据
    const hanziData = await readCSVData();
    const hanziIndex = hanziData.findIndex(item => item.序号 === sequence);
    
    if (hanziIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '未找到指定汉字'
      });
    }
    
    // 更新数据
    hanziData[hanziIndex] = {
      ...hanziData[hanziIndex],
      拼音: 拼音 || hanziData[hanziIndex].拼音,
      词语1: 词语1 || hanziData[hanziIndex].词语1,
      词语2: 词语2 || hanziData[hanziIndex].词语2,
      词语3: 词语3 || hanziData[hanziIndex].词语3
    };
    
    // 写入文件
    await writeCSVData(hanziData);
    
    res.json({
      success: true,
      data: hanziData[hanziIndex],
      message: '汉字数据更新成功'
    });
  } catch (error) {
    console.error('更新汉字数据失败:', error);
    res.status(500).json({
      success: false,
      message: '更新汉字数据失败'
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('../package.json').version
  });
});

// 提供前端应用（必须放在最后，避免覆盖API路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 启动服务器 - 添加端口检测和优雅关闭
async function startServer() {
  try {
    await ensureUserDataDir();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
      console.log(`📁 用户数据目录: ${USER_DATA_DIR}`);
      console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 健康检查: http://${HOST}:${PORT}/health`);
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      server.close((err) => {
        if (err) {
          console.error('服务器关闭时出错:', err);
          process.exit(1);
        }
        console.log('服务器已安全关闭');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 处理未捕获的异常
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason, 'at:', promise);
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer(); 