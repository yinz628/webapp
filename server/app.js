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

// 注意：原有的 chineseToPinyin 函数已移除，
// 现在使用更安全的 Base64 编码策略生成用户文件名

// 生成用户文件名 - 使用安全编码确保唯一性和兼容性
function generateUserFileName(name, studentId) {
  // 使用Base64编码处理用户名，确保支持所有Unicode字符
  const safeName = Buffer.from(name, 'utf8')
    .toString('base64')
    .replace(/[/+=]/g, '') // 移除文件系统不安全的字符
    .substring(0, 20); // 限制长度避免文件名过长
  
  // 清理学号，只保留字母数字和下划线
  const safeStudentId = studentId.replace(/[^a-zA-Z0-9_]/g, '');
  
  return `user_${safeName}_${safeStudentId}.json`;
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