require('dotenv').config();
const build = require('./server');
const logger = require('./lib/logger');

const port = Number(process.env.PORT || 4102);

const app = build();
app.ready().then(() => {
  app.swagger(); // pregătește spec pentru /docs
  app.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    logger.info(`Users Service running at ${address} (docs at /docs)`);
  });
});
