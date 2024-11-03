const express = require('express');
const User = require('../models/User');
const Friend = require('../models/Friend');

const router = express.Router();

// Obtener todos los usuarios que no son amigos
router.get('/', async (req, res) => {

  if (req.isAuthenticated()) {
    try {
      const friends = await Friend.query()
        .where('userId', req.user.id)
        .orWhere('friendId', req.user.id)
        .where('status', 'accepted');
  
      const friendIds = friends.map(friend => friend.friendId === req.user.id ? friend.userId : friend.friendId);
  
      const users = await User.query().whereNotIn('id', friendIds).andWhere('id', '!=', req.user.id);
      res.render('users', { users, layout: 'layouts/main' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al obtener usuarios');
    }
} else {
   res.redirect('/');
}


});

module.exports = router;
