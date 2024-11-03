const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const router = express.Router();

router.get('/', async (req, res) => {
  const posts = await Post.query().withGraphFetched('[author, comments.author]');
  res.render('posts', { posts,layout: 'layouts/main' });
});

router.post('/create', async (req, res) => {
  const { content } = req.body;
  await Post.query().insert({
    content,
    userId: req.user.id
  });
  res.redirect('/posts');
});

router.post('/:id/comment', async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  await Comment.query().insert({
    content,
    postId,
    userId: req.user.id
  });
  res.redirect('/posts');
});

module.exports = router;