const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Friend extends Model {
  static get tableName() {
    return 'friends';
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'friends.userId',
          to: 'users.id'
        }
      },
      friend: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'friends.friendId',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Friend;