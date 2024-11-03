const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();


router.get('/login', (req, res) => {
  const errors = req.flash('error');
  res.render('login', { 
    layout: 'layouts/main', 
    message: errors.length > 0 ? errors[0] : null // Solo pasamos el primer mensaje de error
  });
});



router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    // successRedirect: '/auth/main',
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true // Esto le dice a Passport que use flash
  })(req, res, next);
});


router.get('/register', (req, res) => {
  res.render('register', { layout: 'layouts/main' });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.query().insert({
      username,
      password: hashedPassword,
      email
    });
    res.redirect('/auth/login');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// router.get('/logout', (req, res, next) => {
//   req.logout(err => {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
// });


router.get('/main', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Estás autenticado y puedes ver esta ruta.');
  } else {
    res.redirect('/auth/login'); // Redirige si no está autenticado
  }
});


module.exports = router;