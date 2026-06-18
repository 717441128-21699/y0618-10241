import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

async function saveToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

const saveIntervalMs = 5000;
let saveTimer: NodeJS.Timeout | null = null;
let dirty = false;

function markDirty() {
  dirty = true;
}

function startSaveLoop() {
  if (saveTimer) return;
  saveTimer = setInterval(() => {
    if (dirty) {
      saveToDisk().catch(console.error);
      dirty = false;
    }
  }, saveIntervalMs);
}

function mapRows<T = Record<string, unknown>>(results: { columns: string[]; values: unknown[][] }[]): T[] {
  if (results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as T;
  });
}

function mapOne<T = Record<string, unknown>>(results: { columns: string[]; values: unknown[][] }[]): T | null {
  const rows = mapRows<T>(results);
  return rows.length > 0 ? rows[0] : null;
}

export interface QueryExecResult {
  columns: string[];
  values: unknown[][];
}

export function query(sql: string, params: unknown[] = []): QueryExecResult[] {
  if (!db) throw new Error('Database not initialized');
  return db.exec(sql, params as (string | number | null)[]) as QueryExecResult[];
}

export function run(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params as (string | number | null)[]);
  markDirty();
  return {
    lastInsertRowid: Number(db.getRowsModified() > 0 ? (db as unknown as { lastInsertRowid?: number }).lastInsertRowid ?? 0 : 0),
    changes: db.getRowsModified(),
  };
}

export function prepareRun(namedSql: string, namedParams: Record<string, unknown>): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(namedSql);
  stmt.bind(namedParams as Record<string, string | number | null>);
  stmt.step();
  stmt.free();
  markDirty();
  const changes = db.getRowsModified();
  const lastIdRes = query('SELECT last_insert_rowid() as id');
  const lastId = lastIdRes.length > 0 && lastIdRes[0].values.length > 0 ? Number(lastIdRes[0].values[0][0]) : 0;
  return { lastInsertRowid: lastId, changes };
}

export function prepareGet<T = Record<string, unknown>>(namedSql: string, params: unknown[] | Record<string, unknown> = []): T | null {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(namedSql);
  if (Array.isArray(params)) {
    stmt.bind(params as (string | number | null)[]);
  } else {
    stmt.bind(params as Record<string, string | number | null>);
  }
  let row: T | null = null;
  const colNames = stmt.getColumnNames();
  if (stmt.step()) {
    const values = stmt.getAsObject() as Record<string, unknown>;
    row = values as T;
    void colNames;
  }
  stmt.free();
  return row;
}

export function prepareAll<T = Record<string, unknown>>(namedSql: string, params: unknown[] | Record<string, unknown> = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(namedSql);
  if (Array.isArray(params)) {
    stmt.bind(params as (string | number | null)[]);
  } else {
    stmt.bind(params as Record<string, string | number | null>);
  }
  const result: T[] = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return result;
}

function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  return mapRows<T>(query(sql, params));
}

function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
  return mapOne<T>(query(sql, params));
}

export async function initDatabase(): Promise<void> {
  SQL = await initSqlJs({
    locateFile: (file: string) => path.join(path.dirname(require.resolve('sql.js')), file),
  });

  let buffer: Uint8Array | null = null;
  if (fs.existsSync(dbPath)) {
    buffer = new Uint8Array(fs.readFileSync(dbPath));
  }
  db = new SQL.Database(buffer || undefined);

  db.run(`PRAGMA journal_mode = WAL`);
  db.run(`PRAGMA foreign_keys = ON`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      file_path TEXT DEFAULT '',
      author_id INTEGER NOT NULL,
      category TEXT DEFAULT 'other',
      duration INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'uploading',
      hls_360p TEXT DEFAULT '',
      hls_720p TEXT DEFAULT '',
      hls_1080p TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS danmaku (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      time REAL NOT NULL,
      content TEXT NOT NULL,
      color TEXT DEFAULT '#FFFFFF',
      font_size TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_danmaku_video_time ON danmaku(video_id, time);

    CREATE TABLE IF NOT EXISTS play_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      position REAL DEFAULT 0,
      duration REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      play_token TEXT DEFAULT '',
      token_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(play_token);
  `);
  markDirty();

  const userCount = get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM users');
  if (!userCount || userCount.cnt === 0) {
    const hash = bcrypt.hashSync('demo123', 10);
    run(`INSERT INTO users (id, username, email, password_hash, avatar) VALUES (1, 'demo_user', 'demo@example.com', ?, '')`, [hash]);
    console.log('[DB] Created demo user: demo_user / demo123');
  }

  const videoCount = get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM videos');
  if (!videoCount || videoCount.cnt === 0) {
    const sampleVideos = [
      { id: 1, title: '深入理解React Hooks的工作原理', description: '本视频深入讲解React Hooks的底层实现机制，包括useState、useEffect、useCallback等核心Hook的源码解析，帮助你更好地理解和使用React函数式组件。', category: 'tech', duration: 1823, is_paid: 0, price: 0, prompt: 'modern%20tech%20conference%20stage%20with%20react%20logo%20presentation%20purple%20blue%20lights' },
      { id: 2, title: '4K自然风光纪录片：阿尔卑斯山的四季', description: '跟随镜头穿越阿尔卑斯山脉，感受春夏秋冬的绝美交替。从翠绿草甸到皑皑白雪，每一帧都是壁纸级别的视觉盛宴。', category: 'entertainment', duration: 3542, is_paid: 1, price: 9.9, prompt: 'stunning%20alps%20mountain%20landscape%20sunset%20golden%20hour%20snow%20peaks%20reflection%20lake' },
      { id: 3, title: 'TypeScript高级类型体操完全指南', description: '从零开始掌握TypeScript的类型系统，涵盖条件类型、映射类型、模板字面量、递归类型等进阶技巧，让你的代码类型更加安全。', category: 'education', duration: 2456, is_paid: 1, price: 19.9, prompt: 'programming%20code%20editor%20dark%20theme%20typescript%20syntax%20highlight%20purple%20neon' },
      { id: 4, title: '《赛博朋克2077》全流程速通攻略', description: '幻影自由DLC全主线+支线任务完美攻略，包含全结局触发条件、隐藏武器位置、BOSS战技巧。', category: 'gaming', duration: 5210, is_paid: 0, price: 0, prompt: 'cyberpunk%20neon%20city%20night%20futuristic%20gaming%20aesthetic%20pink%20purple%20blue' },
      { id: 5, title: 'Lo-Fi Chill Mix - 深夜学习工作背景音乐', description: '3小时精选Lo-Fi嘻哈混音，适合学习、工作、放松。柔和的节拍搭配雨声，陪你度过每一个专注的夜晚。', category: 'music', duration: 10800, is_paid: 0, price: 0, prompt: 'lofi%20chill%20aesthetic%20cozy%20room%20rain%20window%20night%20warm%20lamp%20vinyl' },
      { id: 6, title: '前端性能优化实战：从入门到精通', description: '完整的前端性能优化体系课程，涵盖资源加载、渲染优化、代码分割、缓存策略、性能监控等全方位内容。', category: 'tech', duration: 3120, is_paid: 1, price: 29.9, prompt: 'web%20performance%20speed%20optimization%20dashboard%20metrics%20dark%20theme' },
      { id: 7, title: '一小时学会弹吉他：零基础入门教程', description: '超详细的吉他入门教学，持琴姿势、右手拨弦、左手按弦、基础和弦一网打尽。跟着练，一小时就能弹唱你的第一首歌！', category: 'education', duration: 3680, is_paid: 0, price: 0, prompt: 'acoustic%20guitar%20lesson%20warm%20sunlight%20cozy%20room%20music%20sheets' },
      { id: 8, title: '【美食】正宗日式拉面制作全流程', description: '从猪骨汤底到叉烧肉，从溏心蛋到面条配比，带你一步步还原日本拉面名店的味道。', category: 'other', duration: 1450, is_paid: 0, price: 0, prompt: 'authentic%20japanese%20ramen%20tonkotsu%20steam%20chashu%20egg%20aesthetic' },
    ];

    const insert = db.prepare(`INSERT INTO videos (id, title, description, cover_url, file_path, author_id, category, duration, view_count, like_count, is_paid, price, status, hls_360p, hls_720p, hls_1080p, created_at) VALUES (?, ?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, CURRENT_TIMESTAMP)`);

    for (const v of sampleVideos) {
      const cover = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${v.prompt}&image_size=landscape_16_9`;
      insert.run([v.id, v.title, v.description, cover, v.category, v.duration, Math.floor(Math.random() * 50000) + 1000, Math.floor(Math.random() * 5000) + 100, v.is_paid, v.price, `/api/stream/${v.id}/360p.m3u8`, `/api/stream/${v.id}/720p.m3u8`, `/api/stream/${v.id}/1080p.m3u8`]);
    }
    insert.free();

    const sampleDanmaku: { video_id: number; time: number; content: string; color: string }[] = [
      { video_id: 1, time: 10.5, content: '这个系列终于更了！', color: '#FFFFFF' },
      { video_id: 1, time: 15.2, content: '前排支持', color: '#FF6B6B' },
      { video_id: 1, time: 42.8, content: '讲得真的太好了', color: '#4ECDC4' },
      { video_id: 1, time: 65.3, content: '这里突然懂了！！', color: '#FFE66D' },
      { video_id: 1, time: 120.0, content: '三连了', color: '#FFFFFF' },
      { video_id: 1, time: 180.5, content: '这个比喻太形象了', color: '#C7F464' },
      { video_id: 2, time: 5.0, content: '画质绝了！', color: '#FFFFFF' },
      { video_id: 2, time: 25.3, content: '这也太美了吧', color: '#88D8B0' },
      { video_id: 2, time: 89.0, content: '想去旅游了', color: '#FFAAA5' },
      { video_id: 3, time: 32.1, content: '学到了学到了', color: '#FFFFFF' },
      { video_id: 3, time: 78.4, content: '类型体操名不虚传', color: '#A78BFA' },
      { video_id: 4, time: 15.0, content: '攻略太详细了', color: '#FFFFFF' },
      { video_id: 5, time: 30.0, content: '这首歌好听', color: '#F472B6' },
      { video_id: 5, time: 120.0, content: '深夜复习打卡', color: '#60A5FA' },
    ];

    const danmakuInsert = db.prepare(`INSERT INTO danmaku (video_id, user_id, username, time, content, color, font_size) VALUES (?, 1, 'demo_user', ?, ?, ?, 'medium')`);
    for (const d of sampleDanmaku) {
      danmakuInsert.run([d.video_id, d.time, d.content, d.color]);
    }
    danmakuInsert.free();

    markDirty();
    console.log('[DB] Inserted sample data');
  }

  startSaveLoop();
  process.on('beforeExit', () => { if (dirty) saveToDisk().catch(() => {}); });
  console.log('[DB] Initialized at', dbPath);
}

export { all, get };
