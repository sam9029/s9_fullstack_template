const settings = require("../config/index.js");
exports.knexProxy = require("knex")({
  client: "mysql",
  connection: settings.dbs.log_base,
  // acquireConnectionTimeout: 10000,
  pool: { min: 2, max: 20 },
});
