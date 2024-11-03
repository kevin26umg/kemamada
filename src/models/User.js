const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get relationMappings() {
    const Post = require('./Post');
    const Friend = require('./Friend');
    const Message = require('./Message');

    return {
      posts: {
        relation: Model.HasManyRelation,
        modelClass: Post,
        join: {
          from: 'users.id',
          to: 'posts.userId'
        }
      },
      friends: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'users.id',
          through: {
            from: 'friends.userId',
            to: 'friends.friendId'
          },
          to: 'users.id'
        }
      },
      messages: {
        relation: Model.HasManyRelation,
        modelClass: Message,
        join: {
          from: 'users.id',
          to: 'messages.senderId'
        }
      }
    };
  }
}

module.exports = User;