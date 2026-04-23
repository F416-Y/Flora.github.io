/**
 * Flora's Space — 留言板后端服务器
 * 提供 REST API 供留言板跨设备同步
 *
 * 启动方式: npm start
 * 访问地址: http://localhost:3001
 */
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const initSqlJs = require('sql.js');
const fs = require('fs');
const os = require('os');

const PORT = process.env.PORT || 3001;
const AUTHOR_PASSWORD = process.env.AUTHOR_PASSWORD || 'FloraAdmin0416';
const DB_PATH = path.join(__dirname, 'guestbook.db');

// ===== 数据库初始化 =====
let db;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDatabase() {
  const SQL = await initSqlJs();

  // 尝试加载已有数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      body TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      delete_token TEXT NOT NULL
    )
  `);
  saveDb();
  console.log('  数据库初始化完成');
}

// 工具: 将 sql.js exec 结果转为对象数组
function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

const app = express();

// ===== 中间件 =====
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ===== API 路由 =====

/**
 * GET /api/messages — 获取所有留言（不含 deleteToken）
 */
app.get('/api/messages', (req, res) => {
  try {
    const result = db.exec('SELECT id, name, email, body AS message, timestamp FROM messages ORDER BY timestamp DESC');
    const messages = rowsToObjects(result);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('GET /api/messages 错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * POST /api/messages — 创建新留言
 * Body: { name, email?, message }
 */
app.post('/api/messages', (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '姓名不能为空' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: '留言内容不能为空' });
    }

    const id = crypto.randomBytes(8).toString('hex');
    const deleteToken = crypto.randomBytes(6).toString('hex');
    const timestamp = new Date().toISOString();

    db.run(
      'INSERT INTO messages (id, name, email, body, timestamp, delete_token) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name.trim(), (email || '').trim(), message.trim(), timestamp, deleteToken]
    );
    saveDb();

    console.log(`[新留言] ${name.trim()} — ${message.trim().substring(0, 40)}...`);

    res.json({
      success: true,
      message: {
        id,
        name: name.trim(),
        email: (email || '').trim(),
        message: message.trim(),
        timestamp,
        deleteToken
      }
    });
  } catch (err) {
    console.error('POST /api/messages 错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * DELETE /api/messages/:id — 删除留言
 * Body: { deleteToken?, authorPassword? }
 */
app.delete('/api/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { deleteToken, authorPassword } = req.body;

    // 查找留言
    const rows = db.exec('SELECT * FROM messages WHERE id = ?', [id]);
    const results = rowsToObjects(rows);

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: '留言不存在' });
    }

    const msg = results[0];

    // 验证权限
    let authorized = false;
    if (authorPassword === AUTHOR_PASSWORD) {
      authorized = true;
    } else if (deleteToken && deleteToken === msg.delete_token) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ success: false, error: '验证失败！只有网站作者和留言发布者可以删除。' });
    }

    db.run('DELETE FROM messages WHERE id = ?', [id]);
    saveDb();

    console.log(`[已删除] ${msg.name} 的留言 (ID: ${id})`);

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/messages 错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 获取局域网 IP
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '无法获取';
}

// ===== 启动服务器 =====
async function start() {
  await initDatabase();
  const lanIp = getLanIp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ✦ Flora's Space 留言板服务已启动 ✦`);
    console.log(`  ───────────────────────────────`);
    console.log(`  本机访问:     http://localhost:${PORT}`);
    console.log(`  局域网访问:   http://${lanIp}:${PORT}`);
    console.log(`  手机访问:   请确保手机和电脑在同一个 WiFi 下`);
    console.log(`              然后在手机浏览器打开上面的"局域网访问"地址`);
    console.log(`  ───────────────────────────────`);
    console.log(`  API 地址:     http://localhost:${PORT}/api/messages`);
    console.log(`  作者密码:     ${AUTHOR_PASSWORD}`);
    console.log(`  数据库位置:   ${DB_PATH}`);
    console.log(`  ───────────────────────────────`);
    console.log(`  按 Ctrl+C 停止服务\n`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
