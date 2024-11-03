// migrations/[timestamp]_add_image_to_posts_and_create_likes_table.js
exports.up = function(knex) {
  return knex.schema
    .table('posts', function(table) {
      table.string('image');
    })
    .createTable('likes', function(table) {
      table.increments('id').primary();
      table.integer('userId').unsigned().notNullable();
      table.integer('postId').unsigned().notNullable();
      table.timestamps(true, true);
      table.foreign('userId').references('users.id').onDelete('CASCADE');
      table.foreign('postId').references('posts.id').onDelete('CASCADE');
      table.unique(['userId', 'postId']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('posts', function(table) {
      table.dropColumn('image');
    })
    .dropTable('likes');
};