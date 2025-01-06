const settings = require("../config/index.js");

/**
 * @typedef {import("knex").Knex } Knex
 */

/**
 * @type { Knex }
 */
exports.knexProxy = require("knex")({
  client: "mysql",
  connection: settings.dbs["xgfx_base"],
  pool: { min: 2, max: 40 },
  // debug: true,
  // log: {
  //   debug(message) {
  //     console.log(message.sql);
  //   },
  // },
});
