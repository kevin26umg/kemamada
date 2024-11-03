const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { raw } = require('objection');

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/uploads/posts')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {

  if (req.isAuthenticated()) {
    try {
      const currentUser = await User.query()
        .findById(req.user.id)
        .withGraphFetched('friends');
  
      const friendIds = currentUser.friends.map(friend => friend.id);
      friendIds.push(req.user.id); // Incluir los posts del usuario actual
  
      const posts = await Post.query()
        .whereIn('userId', friendIds)
        .withGraphFetched('[author, comments.author, likedBy]')
        .orderBy('created_at', 'desc');
  
      res.render('posts', { posts, currentUser: req.user, layout: 'layouts/main' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching posts');
    }
  
} else {
   res.redirect('/');
}

});

router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const postData = {
      content,
      userId: req.user.id,
    };
    if (req.file) {
      postData.image = '/uploads/posts/' + req.file.filename;
    }
    await Post.query().insert(postData);
    res.redirect('/posts');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating post');
  }
});

router.post('/:id/comment', async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    await Comment.query().insert({
      content,
      postId,
      userId: req.user.id
    });
    res.redirect('/posts');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating comment');
  }
});

router.post('/:id/like', async (req, res) => {

  
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Validar si postId está definido
    if (!postId) {
      return res.status(400).send('Post ID is required');
    }

    const post = await Post.query().findById(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    const alreadyLiked = await post.$relatedQuery('likedBy')
      .where('users.id', userId);

    if (alreadyLiked.length === 0) {
      await post.$relatedQuery('likedBy').relate(userId);
    } else {
      await post.$relatedQuery('likedBy')
        .unrelate()
        .where('users.id', userId);
    }
    res.redirect('/posts');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error liking/unliking post');
  }
});


module.exports = router;