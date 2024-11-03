// migrations/[timestamp]_create_notifications_table.js
exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.integer('userId').unsigned().notNullable();
    table.string('type').notNullable();
    table.string('message').notNullable();
    table.integer('postId').unsigned();
    table.boolean('read').defaultTo(false);
    table.timestamps(true, true);
    table.foreign('userId').references('users.id').onDelete('CASCADE');
    table.foreign('postId').references('posts.id').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};