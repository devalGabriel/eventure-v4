require('dotenv').config();
const build = require('./server');

const port = Number(process.env.PORT || 4105);
const app = build();

app.ready().then(() => {
  app.swagger?.(); // dacă e înregistrat
  app.listen({ port, host: '0.0.0.0' }, (err, addr) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`Notifications Service running at ${addr}`);
  });
});
