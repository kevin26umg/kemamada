document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Unirse a la sala del usuario actual
    const userId = document.body.dataset.userId;
    if (userId) {
        socket.emit('join', userId);
    }

    // document.querySelectorAll('.like-form').forEach(form => {
    //     form.addEventListener('submit', async (e) => {
    //       e.preventDefault();
      
    //       // Obtén el postId desde el botón dentro del formulario
    //       const postId = form.querySelector('.like-button').getAttribute('data-post-id');
      
    //       try {
    //         const response = await fetch(`/posts/${postId}/like`, {
    //           method: 'POST',
    //           headers: { 'Content-Type': 'application/json' }
    //         });
    //         if (response.ok) {
    //           const result = await response.json();
    //           document.getElementById(`like-count-${postId}`).textContent = `${result.likeCount} Likes`;
    //         }
    //       } catch (error) {
    //         console.error('Error liking post:', error);
    //       }
    //     });
    //   });
      

    // document.querySelectorAll('.like-form').forEach(form => {
    //     form.addEventListener('submit', async (e) => {
    //       e.preventDefault();
      
    //       const likeButton = form.querySelector('.like-button');
    //       const postId = likeButton.getAttribute('data-post-id');
    //         alert(postId);
    //       try {
    //         const response = await fetch(`/posts/${postId}/like`, {
    //           method: 'POST',
    //           headers: { 'Content-Type': 'application/json' }
    //         });
    //         if (response.ok) {
    //           const result = await response.json();
    //           const likeCountElement = document.getElementById(`like-count-${postId}`);
    //           likeCountElement.textContent = `${result.likeCount} Likes`;
      
    //           // Cambiar el color del botón de like
    //           const svgElement = likeButton.querySelector('svg');
    //           if (svgElement) {
    //             if (svgElement.getAttribute('fill') === 'none') {
    //               svgElement.setAttribute('fill', 'currentColor');
    //             } else {
    //               svgElement.setAttribute('fill', 'none');
    //             }
    //           }
    //         }
    //       } catch (error) {
    //         console.error('Error liking post:', error);
    //       }
    //     });
    //   });


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
            commentElement.className = 'bg-gray-100 p-4 rounded mt-2';
            commentElement.innerHTML = `
                <p>${comment.content}</p>
                <p class="text-sm text-gray-500">Comentado por ${comment.author.username}</p>
            `;
            commentContainer.appendChild(commentElement);
            
        }
    });

    // Manejar notificaciones
    socket.on('notification', (notification) => {
        const notificationContainer = document.getElementById('notification-container');
        const notificationElement = document.createElement('div');
        notificationElement.className = 'bg-blue-500 text-white p-4 rounded mb-2';
        notificationElement.textContent = notification.message;
        notificationContainer.appendChild(notificationElement);
        setTimeout(() => {
            notificationElement.remove();
        }, 5000);
    });
});
