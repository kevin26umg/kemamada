// src/models/Notification.js
const { Model } = require('objection');

class Notification extends Model {
  static get tableName() {
    return 'notifications';
  }

  static get relationMappings() {
    const User = require('./User');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'notifications.userId',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Notification;