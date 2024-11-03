const express = require('express');
const Friend = require('../models/Friend');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (req, res) => {

  if (req.isAuthenticated()) {
    const friends = await Friend.query()
    .where('userId', req.user.id)
    .withGraphFetched('friend');
  const friendRequests = await Friend.query()
    .where('friendId', req.user.id)
    .where('status', 'pending')
    .withGraphFetched('user');
  res.render('friends', { friends, friendRequests,layout: 'layouts/main' });
} else {
   res.redirect('/');
}


});

router.post('/request/:id', async (req, res) => {
  const friendId = req.params.id;
  await Friend.query().insert({
    userId: req.user.id,
    friendId,
    status: 'pending'
  });
  res.redirect('/friends');
});

router.post('/accept/:id', async (req, res) => {
  const userId = req.params.id;
  await Friend.query()
    .where('userId', userId)
    .where('friendId', req.user.id)
    .patch({ status: 'accepted' });
  await Friend.query().insert({
    userId: req.user.id,
    friendId: userId,
    status: 'accepted'
  });
  res.redirect('/friends');
});

router.post('/reject/:id', async (req, res) => {
  const userId = req.params.id;
  await Friend.query()
    .where('userId', userId)
    .where('friendId', req.user.id)
    .delete();
  res.redirect('/friends');
});

module.exports = router;