const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Message extends Model {
  static get tableName() {
    return 'messages';
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      sender: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'messages.senderId',
          to: 'users.id'
        }
      },
      recipient: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'messages.recipientId',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Message;