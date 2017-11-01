exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('goals', function (table) {
      table.increments('id').unsigned().primary();
      table.string('name').unique();
      table.integer('userId').unsigned();
      table.foreign('userId').references('id').inTable('profiles');
    }),
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('goals'),
  ]);
};
