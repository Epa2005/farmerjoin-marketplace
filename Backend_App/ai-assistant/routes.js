/**
 * System Assistant router — mounted at /api/system-assistant.
 * The built-in, self-hosted assistant that knows the FarmerJoin
 * marketplace. No external API keys, no Ollama, works on any host.
 *
 * Because it receives `db`, the assistant rebuilds its context from the
 * LIVE database on every /chat request (system facts, change log and
 * admin-taught knowledge), so it always reflects changes in the system.
 */

const express = require('express');
const { answer, welcomeMessage, startChips, allTopics } = require('./engine');
const systemKnowledge = require('./systemKnowledge');

/** Extract authenticated role from the JWT payload without full verification (role is non-sensitive). */
function roleFromAuth(req) {
  const auth = req.headers && req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7);
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const claims = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    return claims.role || claims.user_type || (claims.user && claims.user.role) || null;
  } catch (e) {
    return null;
  }
}

/** Build the live system context that powers every chat answer. */
async function buildContext(db) {
  const [changes, knowledge, facts] = await Promise.all([
    systemKnowledge.getChangelog(db, 8),
    systemKnowledge.getKnowledgeEntries(db),
    systemKnowledge.getFacts(db),
  ]);
  return { changes, knowledge, facts };
}

function createSystemAssistantRouter({ db, auth } = {}) {
  const router = express.Router();

  // ------------------------------------------------------------------
  // Chat (core) — context is refreshed from the database on every call
  // ------------------------------------------------------------------
  router.post('/chat', express.json({ limit: '64kb' }), async (req, res) => {
    if (!db) {
      return res.status(503).json({ success: false, error: 'assistant database is not available' });
    }
    const body = req.body || {};
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query) return res.status(400).json({ success: false, error: 'query is required' });
    if (query.length > 1000) return res.status(400).json({ success: false, error: 'query exceeds 1000 characters' });

    const language = typeof body.language === 'string' ? body.language.slice(0, 2) : undefined;
    const role = roleFromAuth(req);

    try {
      const context = await buildContext(db);
      const result = answer({ query, language, role, context });
      result.dynamic = {
        knowledgeLoaded: Array.isArray(context.knowledge) ? context.knowledge.length : 0,
        changesLoaded: Array.isArray(context.changes) ? context.changes.length : 0,
      };
      res.json(result);
    } catch (e) {
      res.status(500).json({
        success: false,
        error: 'The assistant engine hit an internal error. Please try again.',
      });
    }
  });

  // ------------------------------------------------------------------
  // Introspection
  // ------------------------------------------------------------------
  router.get('/welcome', (req, res) => {
    const role = roleFromAuth(req);
    res.json({ success: true, message: welcomeMessage(role), chips: startChips() });
  });

  router.get('/topics', (req, res) => {
    res.json({ success: true, topics: allTopics() });
  });

  router.get('/changelog', async (req, res) => {
    if (!db) return res.json({ success: true, changes: [] });
    try {
      const changes = await systemKnowledge.getChangelog(db, 8);
      res.json({ success: true, changes });
    } catch (e) {
      res.json({ success: true, changes: [] });
    }
  });

  router.get('/health', async (req, res) => {
    let live = false;
    if (db) {
      try {
        const facts = await systemKnowledge.getFacts(db);
        live = facts.totalProducts != null;
      } catch (e) {
        live = false;
      }
    }
    res.json({ success: true, service: 'system-assistant', status: 'ok', engine: 'built-in', liveDatabase: live });
  });

  // ------------------------------------------------------------------
  // Admin tools — teach the assistant new facts at any time
  // ------------------------------------------------------------------
  if (auth) {
    router.get('/admin/knowledge', auth, auth.requireRole(['admin', 'sub_admin']), async (req, res) => {
      if (!db) return res.status(503).json({ success: false, error: 'database not available' });
      try {
        const entries = await systemKnowledge.getKnowledgeEntries(db);
        res.json({ success: true, entries });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    router.post('/admin/knowledge', auth, auth.requireRole(['admin', 'sub_admin']), express.json({ limit: '64kb' }), async (req, res) => {
      if (!db) return res.status(503).json({ success: false, error: 'database not available' });
      const { topic, keywords, answer: answerText, followUps } = req.body || {};
      try {
        const saved = await systemKnowledge.addKnowledgeEntry(db, { topic, keywords, answer: answerText, followUps });
        res.json({ success: true, entry: saved });
      } catch (e) {
        res.status(400).json({ success: false, error: e.message });
      }
    });

    router.delete('/admin/knowledge/:id', auth, auth.requireRole(['admin', 'sub_admin']), async (req, res) => {
      if (!db) return res.status(503).json({ success: false, error: 'database not available' });
      try {
        const result = await systemKnowledge.deleteKnowledgeEntry(db, req.params.id);
        res.json(result);
      } catch (e) {
        res.status(400).json({ success: false, error: e.message });
      }
    });

    router.post('/admin/changes', auth, auth.requireRole(['admin', 'sub_admin']), express.json({ limit: '64kb' }), async (req, res) => {
      if (!db) return res.status(503).json({ success: false, error: 'database not available' });
      const { title, description } = req.body || {};
      try {
        const saved = await systemKnowledge.addChange(db, { title, description });
        res.json({ success: true, change: saved });
      } catch (e) {
        res.status(400).json({ success: false, error: e.message });
      }
    });
  }

  return router;
}

module.exports = createSystemAssistantRouter;
module.exports.createRouter = createSystemAssistantRouter;

// Default export keeps `require('./ai-assistant/routes')` usable directly
// as a plain router for tooling/tests (no DB).
module.exports.router = createSystemAssistantRouter({});