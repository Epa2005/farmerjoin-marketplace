/**
 * System Assistant router — mounted at /api/system-assistant.
 * The built-in, self-hosted assistant that knows the FarmerJoin
 * marketplace. No external API keys, no Ollama, works on any host.
 */

const express = require('express');
const { answer, welcomeMessage, startChips, allTopics } = require('./engine');

const router = express.Router();

/** Extract authenticated role from the JWT payload without full verification (role is non-sensitive). */
function roleFromAuth(req) {
  const auth = req.headers && req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7);
  try {
    const payload = token.split('.');
    if (payload.length < 2) return null;
    const claims = JSON.parse(
      Buffer.from(payload[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    return claims.role || claims.user_type || (claims.user && claims.user.role) || null;
  } catch (e) {
    return null;
  }
}

// Lightweight JSON body parsing for /chat
router.post('/chat', express.json({ limit: '64kb' }), (req, res) => {
  const body = req.body || {};
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return res.status(400).json({ success: false, error: 'query is required' });
  }
  if (query.length > 1000) {
    return res.status(400).json({ success: false, error: 'query exceeds 1000 characters' });
  }
  const language = typeof body.language === 'string' ? body.language.slice(0, 2) : undefined;
  const role = roleFromAuth(req);

  try {
    const result = answer({ query, language, role });
    res.json(result);
  } catch (e) {
    res.status(500).json({
      success: false,
      error: 'The assistant engine hit an internal error. Please try again.',
    });
  }
});

router.get('/welcome', (req, res) => {
  const role = roleFromAuth(req);
  res.json({ success: true, message: welcomeMessage(role), chips: startChips() });
});

router.get('/topics', (req, res) => {
  res.json({ success: true, topics: allTopics() });
});

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'system-assistant', status: 'ok', engine: 'built-in' });
});

module.exports = router;