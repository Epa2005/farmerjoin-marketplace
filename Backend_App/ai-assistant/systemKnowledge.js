/**
 * FarmerJoin System Knowledge DAO
 * ------------------------------------------------------------------
 * Persists the assistant's dynamic knowledge so it reflects EVERY
 * change made to the system, any time:
 *
 *   system_knowledge   — admin-editable Q&A entries (instantly teach
 *                        the assistant new facts/topics).
 *   system_change_log  — a changelog of platform changes that the
 *                        assistant can read back ("what's new?").
 *
 * Live facts (product totals, categories, user counts) are read from
 * the real tables on every request (with a short cache), so answers
 * always mirror the current database state.
 */

const FACT_CACHE_TTL_MS = 30 * 1000;
let factsCache = { at: 0, data: null };

function q(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function tableExists(db, name) {
  return q(db, "SELECT 1 FROM information_schema.tables WHERE table_name = ?", [name.toLowerCase()])
    .then((rows) => (rows && rows.length ? rows[0].table_schema : null))
    .catch(() => null);
}

async function ensureTables(db) {
  if (db.isPostgres) {
    await q(db, `
      CREATE TABLE IF NOT EXISTS system_knowledge (
        id BIGSERIAL PRIMARY KEY,
        topic TEXT NOT NULL,
        keywords TEXT NOT NULL DEFAULT '',
        answer TEXT NOT NULL,
        follow_ups TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await q(db, `
      CREATE TABLE IF NOT EXISTS system_change_log (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } else {
    await q(db, `
      CREATE TABLE IF NOT EXISTS system_knowledge (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic VARCHAR(200) NOT NULL,
        keywords TEXT NOT NULL,
        answer TEXT NOT NULL,
        follow_ups TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await q(db, `
      CREATE TABLE IF NOT EXISTS system_change_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}

/** Returns current live facts about the system (cached briefly). */
async function getFacts(db, ttl = FACT_CACHE_TTL_MS) {
  if (factsCache.data && Date.now() - factsCache.at < ttl) return factsCache.data;

  const facts = { counts: {}, categories: [], latestProducts: [], fresh: true };
  const tasks = [];

  tasks.push(
    q(db, 'SELECT COUNT(*) AS total FROM products')
      .then((r) => { facts.totalProducts = Number(r[0]?.total || 0); })
      .catch(() => { facts.totalProducts = null; })
  );
  tasks.push(
    q(db, 'SELECT COUNT(*) AS total FROM users')
      .then((r) => { facts.totalUsers = Number(r[0]?.total || 0); })
      .catch(() => { facts.totalUsers = null; })
  );
  tasks.push(
    q(db, 'SELECT role, COUNT(*) AS total FROM users GROUP BY role')
      .then((rows) => {
        (rows || []).forEach((r) => { facts.counts[r.role || 'other'] = Number(r.total || 0); });
      })
      .catch(() => {})
  );
  tasks.push(
    q(db, 'SELECT category, COUNT(*) AS total FROM products GROUP BY category ORDER BY total DESC LIMIT 8')
      .then((rows) => { facts.categories = (rows || []).map((r) => ({ category: r.category, count: Number(r.total || 0) })); })
      .catch(() => {})
  );
  tasks.push(
    q(db, 'SELECT product_name, price, category, created_at FROM products ORDER BY created_at DESC LIMIT 3')
      .then((rows) => {
        facts.latestProducts = (rows || []).map((r) => ({
          name: r.product_name,
          price: r.price,
          category: r.category,
          createdAt: r.created_at,
        }));
      })
      .catch(() => {})
  );

  await Promise.allSettled(tasks);
  factsCache = { at: Date.now(), data: facts };
  return factsCache.data;
}

async function getChangelog(db, limit = 8) {
  try {
    await ensureTables(db).catch(() => {});
    const rows = await q(db, `SELECT id, title, description, created_at FROM system_change_log ORDER BY created_at DESC, id DESC LIMIT ?`, [limit]);
    return (rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      createdAt: r.created_at,
    }));
  } catch (e) {
    return [];
  }
}

async function addChange(db, { title, description = '' }) {
  await ensureTables(db);
  const cleanTitle = String(title || '').trim().slice(0, 300);
  const cleanDescription = String(description || '').trim().slice(0, 2000);
  if (!cleanTitle) throw new Error('title is required');
  const res = await q(db, 'INSERT INTO system_change_log (title, description) VALUES (?, ?)', [cleanTitle, cleanDescription]);
  return { id: res.insertId != null ? res.insertId : res.rows?.[0]?.id, title: cleanTitle, description: cleanDescription, createdAt: new Date().toISOString() };
}

async function getKnowledgeEntries(db) {
  try {
    await ensureTables(db).catch(() => {});
    const rows = await q(db, 'SELECT id, topic, keywords, answer, follow_ups FROM system_knowledge ORDER BY id DESC LIMIT 500');
    return (rows || []).map((r) => ({
      id: r.id,
      topic: r.topic,
      keywords: r.keywords || '',
      answer: r.answer || '',
      followUps: r.follow_ups ? r.follow_ups.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [],
    }));
  } catch (e) {
    return [];
  }
}

async function addKnowledgeEntry(db, { topic, keywords, answer, followUps }) {
  await ensureTables(db);
  const cleanTopic = String(topic || '').trim().slice(0, 200);
  const cleanAnswer = String(answer || '').trim();
  if (!cleanTopic || !cleanAnswer) throw new Error('topic and answer are required');
  if (cleanAnswer.length > 4000) throw new Error('answer exceeds 4000 characters');
  const cleanKeywords = String(keywords || '').trim().slice(0, 1000);
  const cleanFollowUps = (Array.isArray(followUps) ? followUps.join('\n') : String(followUps || '')).slice(0, 2000);
  const res = await q(db, 'INSERT INTO system_knowledge (topic, keywords, answer, follow_ups) VALUES (?, ?, ?, ?)', [
    cleanTopic, cleanKeywords, cleanAnswer, cleanFollowUps,
  ]);
  return { id: res.insertId != null ? res.insertId : res.rows?.[0]?.id, topic: cleanTopic };
}

async function deleteKnowledgeEntry(db, id) {
  await ensureTables(db);
  const res = await q(db, 'DELETE FROM system_knowledge WHERE id = ?', [Number(id)]);
  const deleted = (res && (res.affectedRows != null ? Number(res.affectedRows) : (res.rowCount || 0))) || 0;
  return { deleted };
}

module.exports = {
  ensureTables,
  getFacts,
  getChangelog,
  addChange,
  getKnowledgeEntries,
  addKnowledgeEntry,
  deleteKnowledgeEntry,
  tableExists,
};