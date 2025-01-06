const settings = require("../config/index.js");

/**
 * @typedef {import("knex").Knex } Knex
 */

/**
 * @type { Knex }
 */
exports.knexProxy = require("knex")({
  client: "mysql",
  /*connection: {
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "root",
    database: "ad_base",
  }*/
  connection: settings.dbs["koc_mount"],
  pool: { min: 2, max: 20 },
  // debug: true,
  // log: {
  //   debug(message) {
  //     console.log(message.sql);
  //   },
  // },
});
