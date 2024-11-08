const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');
const expressLayouts = require('express-ejs-layouts');  // Agrega esta línea
const flash = require('connect-flash');
const db = require('./config/database'); // Ajusta la ruta según la estructura de tu proyecto
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'tu_secreto_default',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { 
//     secure: false, // Cambia a true si usas HTTPS
//     maxAge: 60 * 60 * 1000 // 30 minutos
//   } // Cambia a true solo si estás usando HTTPS
// }));
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_default',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 60 * 60 * 1000
  }
});

// Usa el middleware de sesión en Express
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

// Aplica los middleware a Socket.IO
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.user || null; // Esto hará que `user` esté disponible en todas las vistas
  next();
});
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('Usuario autenticado:', req.user); // Muestra el usuario autenticado
  } else {
    console.log('No hay sesión activa');
  }
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);  // Usa express-ejs-layouts

// Passport config
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.query().findOne({ username });
    if (!user) {
      return done(null, false, { message: 'Usuario incorrecto.' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: 'Contraseña incorrecta.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.query().findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use('/auth', require('./routes/auth'));
app.use('/posts', require('./routes/posts'));
app.use('/friends', require('./routes/friends'));
app.use('/chat', require('./routes/chat'));
app.use('/users', require('./routes/users'));
app.use('/profile', require('./routes/profile'));

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/posts');
} else {
  res.render('index', { layout: 'layouts/main' });
}

});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/auth/login');
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.request.user.id);

  const userId = socket.request.user.id;
  socket.join(userId);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log(`Usuario ${userId} se unió a la sala ${roomId}`);
  });

  socket.on('join chat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('leave chat', (chatId) => {
    socket.leave(chatId);
  });


  socket.on('toggleLike', async ({ postId, userId }) => {
    try {
      const post = await Post.query().findById(postId);
      if (!post) {
        socket.emit('likeError', { message: 'Post not found' });
        return;
      }

      const user = await User.query().findById(userId);
      if (!user) {
        socket.emit('likeError', { message: 'User not found' });
        return;
      }

      const alreadyLiked = await post.$relatedQuery('likedBy').findById(userId);

      if (!alreadyLiked) {
        await post.$relatedQuery('likedBy').relate(userId);
      } else {
        await post.$relatedQuery('likedBy')
          .unrelate()
          .where('users.id', userId);
      }

      const likeCount = await post.$relatedQuery('likedBy').count();
      const isLiked = !alreadyLiked;

      io.emit('likeUpdate', { postId, likeCount: likeCount[0].count, isLiked, userId });
    } catch (error) {
      console.error('Error toggling like:', error);
      socket.emit('likeError', { message: 'Error toggling like' });
    }
  });

  socket.on('comment', async ({ postId, userId, content }) => {
    try {
        const comment = await Comment.query().insert({
            postId,
            userId,
            content,
            created_at: new Date(),
        });
        const post = await Post.query().findById(postId).withGraphFetched('[author, comments.[author]]');
        
       const commentWithAuthor = { 
          ...comment, 
          author: await User.query().findById(userId) // Obtener el autor del comentario actual
      };
      
      io.emit('commentUpdate', { 
          postId, 
          comment: commentWithAuthor
      });
      

    } catch (error) {
        console.error('Error en el manejo de comentarios:', error);
    }
});


socket.on('send message', async ({ recipientId, content }) => {
  console.log(`Intento de enviar mensaje: ${userId} -> ${recipientId}: ${content}`);
  try {
    const message = await Message.query().insert({
      senderId: userId,
      recipientId,
      content,
      created_at: new Date()
    });

    console.log('Mensaje guardado en la base de datos:', message);

    // Emitir el mensaje a ambos usuarios
    io.to(userId).to(recipientId).emit('new message', message);
    console.log(`Mensaje emitido a ${userId} y ${recipientId}`);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    socket.emit('message error', { error: 'Error al enviar el mensaje' });
  }
});

socket.on('disconnect', () => {
  console.log(`Usuario ${userId} desconectado`);
});
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});