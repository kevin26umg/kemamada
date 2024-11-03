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
const Notification = require('./models/Notification');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_default',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Cambia a true si usas HTTPS
    maxAge: 60 * 60 * 1000 // 30 minutos
  } // Cambia a true solo si estás usando HTTPS
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

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

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/posts', require('./routes/posts'));
app.use('/friends', require('./routes/friends'));
app.use('/chat', require('./routes/chat'));
app.use('/users', require('./routes/users'));
app.use('/profile', require('./routes/profile'));




app.get('/', (req, res) => {
  // res.render('index', { layout: 'layouts/main' });
  
  if (req.isAuthenticated()) {
    // Si el usuario está autenticado, renderiza el perfil
    // res.render('profile', { user: req.user, layout: 'layouts/main' });
    res.redirect('/posts');
} else {
    // Si no está autenticado, redirige a login
res.render('index', { layout: 'layouts/main' });
}

});

// server.js
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/auth/login');
}

// app.get('/profile', (req, res) => {
//   if (req.isAuthenticated()) {
//       // Si el usuario está autenticado, renderiza el perfil
//       res.render('profile', { user: req.user, layout: 'layouts/main' });
//   } else {
//       // Si no está autenticado, redirige a login
//       res.redirect('/auth/login');
//   }
// });

// server.js
// app.get('/profile', ensureAuthenticated, (req, res) => {
//   res.render('profile', { user: req.user, layout: 'layouts/main' });
// });

// app.get('/posts', ensureAuthenticated, (req, res) => {
//   res.render('posts', { user: req.user, layout: 'layouts/main' });
// });


// app.get('/posts', ensureAuthenticated, (req, res) => {
//   res.render('posts', { user: req.user }); // Omitir el layout
// });



// app.get('/friends', ensureAuthenticated, (req, res) => {
//   res.render('friends', { user: req.user, layout: 'layouts/main' });
// });

// app.get('/chat', ensureAuthenticated, (req, res) => {
//   res.render('chat', { user: req.user, layout: 'layouts/main' });
// });


// exports.getPosts = async (req, res) => {
//   try {
//     const posts = await db('posts')
//       .join('users', 'posts.userId', '=', 'users.id')
//       .select('posts.content', 'posts.created_at', 'users.username')
//       .orderBy('posts.created_at', 'desc');

//     res.render('posts', { posts });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error al obtener las publicaciones');
//   }
// };


// WebSocket
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (userId) => {
    socket.join(userId);
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
        // const post = await Post.query().findById(postId).withGraphFetched('author');
        const post = await Post.query().findById(postId).withGraphFetched('[author, comments.[author]]');
        
        // Emitir a todos los clientes el nuevo comentario
        // io.emit('commentUpdate', { postId, comment: { ...comment, author: post.author } });
        const commentWithAuthor = { 
          ...comment, 
          author: await User.query().findById(userId) // Obtener el autor del comentario actual
      };
      
      // Emitir a todos los clientes el nuevo comentario
      io.emit('commentUpdate', { 
          postId, 
          comment: commentWithAuthor
      });
      

    } catch (error) {
        console.error('Error en el manejo de comentarios:', error);
    }
});


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});