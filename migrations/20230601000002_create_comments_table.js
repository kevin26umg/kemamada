exports.up = function(knex) {
    return knex.schema.createTable('comments', function(table) {
      table.increments('id').primary();
      table.integer('userId').unsigned().notNullable();
      table.integer('postId').unsigned().notNullable();
      table.text('content').notNullable();
      table.timestamps(true, true);
      table.foreign('userId').references('users.id').onDelete('CASCADE');
      table.foreign('postId').references('posts.id').onDelete('CASCADE');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('comments');
  };