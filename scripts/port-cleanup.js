const { exec } = require('child_process');
const util = require('util');
const os = require('os');
const execPromise = util.promisify(exec);

// 需要检查和清理的端口
const PORTS_TO_CHECK = [3000, 3001];

// 检测操作系统
const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';
const isMac = os.platform() === 'darwin';

/**
 * 检查端口是否被占用
 * @param {number} port 端口号
 * @returns {Promise<string|null>} 返回占用端口的进程ID，如果没有被占用返回null
 */
async function checkPortUsage(port) {
  try {
    let command;
    if (isWindows) {
      command = `netstat -ano | findstr :${port}`;
    } else {
      // Linux/Mac
      command = `netstat -tulpn | grep :${port}`;
    }

    const { stdout } = await execPromise(command);
    if (stdout.trim()) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTEN')) {
          if (isWindows) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              return pid;
            }
          } else {
            // Linux/Mac: 提取PID从最后一列 (例如: "1234/node")
            const match = line.match(/(\d+)\/\w+/);
            if (match) {
              return match[1];
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 获取进程信息
 * @param {string} pid 进程ID
 * @returns {Promise<string|null>} 进程名称
 */
async function getProcessInfo(pid) {
  try {
    let command;
    if (isWindows) {
      command = `tasklist | findstr ${pid}`;
    } else {
      // Linux/Mac
      command = `ps -p ${pid} -o comm=`;
    }

    const { stdout } = await execPromise(command);
    if (stdout.trim()) {
      if (isWindows) {
        const processName = stdout.trim().split(/\s+/)[0];
        return processName;
      } else {
        return stdout.trim();
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 终止进程
 * @param {string} pid 进程ID
 * @returns {Promise<boolean>} 是否成功终止
 */
async function killProcess(pid) {
  try {
    let command;
    if (isWindows) {
      command = `taskkill /F /PID ${pid}`;
    } else {
      // Linux/Mac
      command = `kill -9 ${pid}`;
    }

    await execPromise(command);
    console.log(`✅ 成功终止进程 ${pid}`);
    return true;
  } catch (error) {
    console.log(`❌ 无法终止进程 ${pid}:`, error.message);
    return false;
  }
}

/**
 * 清理指定端口
 * @param {number} port 端口号
 */
async function cleanupPort(port) {
  console.log(`🔍 检查端口 ${port}...`);
  
  const pid = await checkPortUsage(port);
  if (!pid) {
    console.log(`✅ 端口 ${port} 可用`);
    return true;
  }

  console.log(`⚠️  端口 ${port} 被进程 ${pid} 占用`);
  
  // 获取进程信息
  const processName = await getProcessInfo(pid);
  if (processName) {
    console.log(`📋 进程信息: ${processName} (PID: ${pid})`);
    
    // 如果是node进程，很可能是我们的旧服务器
    if (processName.toLowerCase().includes('node')) {
      console.log(`🔄 检测到Node.js进程，正在终止...`);
      return await killProcess(pid);
    } else {
      console.log(`⚠️  端口被非Node.js进程占用: ${processName}`);
      console.log(`💡 建议手动检查是否需要终止该进程`);
      return false;
    }
  }
  
  return false;
}

/**
 * 主清理函数
 */
async function main() {
  console.log('🚀 开始端口清理检查...\n');
  
  let allClear = true;
  
  for (const port of PORTS_TO_CHECK) {
    const success = await cleanupPort(port);
    if (!success) {
      allClear = false;
    }
    console.log(''); // 空行分隔
  }
  
  if (allClear) {
    console.log('🎉 所有端口检查完成，可以安全启动服务器！');
    process.exit(0);
  } else {
    console.log('⚠️  部分端口可能仍被占用，请手动检查');
    process.exit(1);
  }
}

// 运行清理
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 端口清理过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = { cleanupPort, checkPortUsage, main }; 