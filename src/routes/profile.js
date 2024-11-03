const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

// Ruta para ver el perfil
router.get('/', isAuthenticated, async (req, res) => {
  res.render('profile', { user: req.user, layout: 'layouts/main' });
});

// Ruta para mostrar el formulario de edición
router.get('/edit', isAuthenticated, (req, res) => {
  res.render('edit-profile', { user: req.user, layout: 'layouts/main' });
});

// Ruta para procesar la actualización del perfil
router.post('/edit', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    const updateData = { username, email, bio };

    if (req.file) {
      updateData.profilePicture = '/uploads/' + req.file.filename;

      // Eliminar la foto de perfil anterior si existe
      if (req.user.profilePicture) {
        const oldPicturePath = path.join(__dirname, '../public', req.user.profilePicture);
        fs.unlink(oldPicturePath, (err) => {
          if (err) console.error('Error deleting old profile picture:', err);
        });
      }
    }

    await User.query().findById(req.user.id).patch(updateData);

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating profile');
  }
});

module.exports = router;