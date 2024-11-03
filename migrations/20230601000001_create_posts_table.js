exports.up = function(knex) {
    return knex.schema.createTable('posts', function(table) {
      table.increments('id').primary();
      table.integer('userId').unsigned().notNullable();
      table.text('content').notNullable();
      table.integer('likes').defaultTo(0);
      table.timestamps(true, true);
      table.foreign('userId').references('users.id').onDelete('CASCADE');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('posts');
  };