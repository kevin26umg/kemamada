exports.up = function(knex) {
    return knex.schema.createTable('messages', function(table) {
      table.increments('id').primary();
      table.integer('senderId').unsigned().notNullable();
      table.integer('recipientId').unsigned().notNullable();
      table.text('content').notNullable();
      table.boolean('read').defaultTo(false);
      table.timestamps(true, true);
      table.foreign('senderId').references('users.id').onDelete('CASCADE');
      table.foreign('recipientId').references('users.id').onDelete('CASCADE');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('messages');
  };