const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Comment extends Model {
  static get tableName() {
    return 'comments';
  }

  static get relationMappings() {
    const User = require('./User');
    const Post = require('./Post');

    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'comments.userId',
          to: 'users.id'
        }
      },
      post: {
        relation: Model.BelongsToOneRelation,
        modelClass: Post,
        join: {
          from: 'comments.postId',
          to: 'posts.id'
        }
      }
    };
  }
}

module.exports = Comment;