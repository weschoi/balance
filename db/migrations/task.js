exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('tasks', function (table) {
      table.increments('id').unsigned().primary();
      table.string('name');
      table.string('notes');
      table.integer('userId').unsigned();
      table.foreign('userId').references('id').inTable('profiles');
      table.integer('categoryId').unsigned();
      table.foreign('categoryId').references('id').inTable('categories');
      table.integer('goalId').unsigned();
      table.foreign('goalId').references('id').inTable('goals');
      table.decimal('score').notNullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('completedAt').defaultTo(knex.fn.now());
    }),
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('tasks'),
  ]);
};
