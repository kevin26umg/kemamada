exports.up = function(knex) {
    return knex.schema.createTable('friends', function(table) {
      table.increments('id').primary();
      table.integer('userId').unsigned().notNullable();
      table.integer('friendId').unsigned().notNullable();
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending');
      table.timestamps(true, true);
      table.foreign('userId').references('users.id').onDelete('CASCADE');
      table.foreign('friendId').references('users.id').onDelete('CASCADE');
      table.unique(['userId', 'friendId']);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('friends');
  };