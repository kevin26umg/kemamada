document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    console.log(socket);
    // Unirse a la sala del usuario actual
    const userId = document.body.dataset.userId;
    if (userId) {
        socket.emit('join', userId);
    }

    socket.on('connect', () => {
        console.log('Conectado al servidor');
      });
    
      socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
      });


      
    document.querySelectorAll('.like-form').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const postId = form.querySelector('.like-button').getAttribute('data-post-id');
          socket.emit('toggleLike', { postId, userId });
        });
      });
    
      socket.on('likeUpdate', ({ postId, likeCount, isLiked, userId: likedByUserId }) => {
        const likeButton = document.querySelector(`.like-button[data-post-id="${postId}"]`);
        const likeCountElement = document.getElementById(`like-count-${postId}`);
        
        if (likeButton && likeCountElement) {
          likeCountElement.textContent = `${likeCount} Likes`;
          
          const svgElement = likeButton.querySelector('svg');
          if (svgElement) {
            if (isLiked && likedByUserId === userId) {
              svgElement.setAttribute('fill', 'currentColor');
            } else {
              svgElement.setAttribute('fill', 'none');
            }
          }
        }
      });
    
      socket.on('likeError', ({ message }) => {
        console.error('Like error:', message);
        // Aquí puedes mostrar un mensaje de error al usuario si lo deseas
      });
      
    // Manejar comentarios
document.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Evitar la recarga de página
        
        const postId = form.dataset.postId; // Obtener postId
        const content = form.querySelector('textarea').value; // Obtener contenido del comentario
        // const userId = "";

        console.log(`Post ID: ${postId}`); // Verificar postId
        console.log(`User ID: ${userId}`); // Verificar userId
        console.log(`Content: ${content}`); // Verificar contenido

        // Emitir el comentario
        socket.emit('comment', { postId, userId, content });
     
        // Reiniciar el formulario
        form.reset(); 
    });
});


    // Actualizar likes
    socket.on('likeUpdate', ({ postId, likeCount }) => {
        const likeCountElement = document.querySelector(`#like-count-${postId}`);
        if (likeCountElement) {
            likeCountElement.textContent = likeCount + ' Likes';
        }
    });

    // Actualizar comentarios
    socket.on('commentUpdate', ({ postId, comment }) => {
        const commentContainer = document.querySelector(`#comments-${postId}`);
            if (commentContainer) {
            const commentElement = document.createElement('div');
            commentElement.className = 'bg-gray-100 p-4 rounded mt-2 text-gray-500 dark:bg-gray-700/60 dark:text-gray-200';
            commentElement.innerHTML = `
                <p>${comment.content}</p>
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-200">${comment.author.username}</p>
            `;
            commentContainer.appendChild(commentElement);
            
        }
    });

    socket.on('newMessage', (message) => {
        console.log(message);
        if (message.senderId === currentFriendId || message.senderId === userId) {
            loadMessages(currentFriendId, currentFriendname, currentFriendProfilePicture);
        }
    });

});
