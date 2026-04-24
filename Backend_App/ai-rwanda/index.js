/**
 * Library entry — import services directly into your existing Node app.
 *
 *   const { assistant, crop, weather, router } = require('ai-rwanda-agriculture');
 *   app.use('/api/ai', router);
 */
module.exports = {
  assistant: require('./services/assistant'),
  crop:      require('./services/cropService'),
  weather:   require('./services/weatherService'),
  ai:        require('./services/aiProvider'),
  language:  require('./services/language'),
  router:    require('./routes/ai.routes'),
};
