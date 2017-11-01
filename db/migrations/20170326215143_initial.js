exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('profiles', function (table) {
      table.increments('id').unsigned().primary();
      table.string('emailAddress', 100).notNullable().unique();
      table.string('firstName', 100).nullable();
      table.string('lastName', 100).nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
    }),
    knex.schema.createTableIfNotExists('auths', function(table) {
      table.increments('id').unsigned().primary();
      table.integer('profileId').references('profiles.id').onDelete('CASCADE');
      table.string('type', 8).notNullable();
      table.string('oauthId', 30).nullable();
      table.string('password', 100).nullable();
      table.string('salt', 100).nullable();
    })
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('auths'),
    knex.schema.dropTable('profiles')
  ]);
};
