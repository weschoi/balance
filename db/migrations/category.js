exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('categories', function (table) {
      table.increments('id').unsigned().primary();
      table.string('name');
    }),
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('categories'),
  ]);
};
