const express = require('express');
const Message = require('../models/Message');
const Friend = require('../models/Friend');

const router = express.Router();

// Obtener amigos aceptados
router.get('/', async (req, res) => {

  if (req.isAuthenticated()) {
    const friends = await Friend.query()
    .where('userId', req.user.id)
    .where('status', 'accepted')
    .withGraphFetched('friend');

    res.render('chat', { 
      friends, 
      userId: req.user.id, 
      currentUser: {
          id: req.user.id,
          username: req.user.username,
          profilePicture: req.user.profilePicture || '/uploads/default.png'
      },
      layout: 'layouts/main' 
  });
} else {
   res.redirect('/');
}



});



// Obtener mensajes entre el usuario y un amigo específico
router.get('/messages/:friendId', async (req, res) => {
  const friendId = req.params.friendId;
  try {
    const messages = await Message.query()
    .where(function() {
        this.where('senderId', req.user.id).where('recipientId', friendId);
    })
    .orWhere(function() {
        this.where('senderId', friendId).where('recipientId', req.user.id);
    })
    .orderBy('created_at'); // Cambia aquí

      
      res.json(messages);
  } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Enviar un nuevo mensaje
// router.post('/send', async (req, res) => {
//   const { recipientId, content } = req.body; // Asegúrate de que el contenido del mensaje y el ID del destinatario se envíen en el cuerpo de la solicitud
//   try {
//     await Message.query().insert({
//       senderId: req.user.id, // ID del usuario que envía el mensaje
//       recipientId,           // ID del usuario que recibe el mensaje
//       content                // Contenido del mensaje
//     });
//     res.status(201).json({ message: 'Mensaje enviado' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error al enviar el mensaje' });
//   }
// });


// router.post('/send', async (req, res) => {
//   const { recipientId, content } = req.body;
//   try {
//       const message = await Message.query().insert({
//           senderId: req.user.id,
//           recipientId,
//           content
//       });
      
//       // Emitir el mensaje a través de Socket.IO
//       const io = req.app.get('io');
//       io.to(recipientId()).to(req.user.id()).emit('newMessage', message);

//       res.status(201).json({ message: 'Mensaje enviado' });
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error al enviar el mensaje' });
//   }
// });


// router.post('/send', async (req, res) => {
//   const { recipientId, content } = req.body;
//   try {
//     const message = await Message.query().insert({
//       senderId: req.user.id,
//       recipientId,
//       content
//     });
    
//     const io = req.app.get('io');
//     io.to(req.user.id).to(recipientId).emit('new message', message);

//     res.status(201).json(message);
//   } catch (error) {
//     console.error('Error al enviar mensaje:', error);
//     res.status(500).json({ error: 'Error al enviar el mensaje' });
//   }
// });


router.post('/send', async (req, res) => {
  const { recipientId, content } = req.body;
  try {
    const message = await Message.query().insert({
      senderId: req.user.id,
      recipientId,
      content
    });
    
    const io = req.app.get('io');
    io.to(req.user.id.toString()).to(recipientId.toString()).emit('new message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

module.exports = router;
