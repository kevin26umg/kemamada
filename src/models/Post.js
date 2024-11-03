// src/models/Post.js
const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class Post extends Model {
  static get tableName() {
    return 'posts';
  }

  static get relationMappings() {
    const User = require('./User');
    const Comment = require('./Comment');

    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'posts.userId',
          to: 'users.id'
        }
      },
      
      comments: {
        relation: Model.HasManyRelation,
        modelClass: Comment,
        join: {
          from: 'posts.id',
          to: 'comments.postId'
        }
      },
      likedBy: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'posts.id',
          through: {
            from: 'likes.postId',
            to: 'likes.userId'
          },
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Post;