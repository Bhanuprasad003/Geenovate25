function addMessage(message, sender) {
    const chatMessages = document.querySelector('.chat-messages');
    
    // Remove welcome message if exists
    const welcomeMessage = document.querySelector('.chat-welcome');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    // Format message with timestamp
    const now = new Date();
    const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot';
    
    // Format the message text for better display of line breaks
    const formattedMessage = message.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    
    bubble.innerHTML = `${formattedMessage}<div class="chat-time">${timeString}</div>`;
    
    // Add to UI and scroll
    const typingIndicator = document.querySelector('.typing-indicator');
    chatMessages.insertBefore(bubble, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Query the Flask backend
  async function sendMessage() {
    const input = document.querySelector('.chat-input');
    const message = input.value.trim();
    
    if (message) {
      // Add user message
      addMessage(message, 'user');
      
      // Clear input
      input.value = '';
      
      // Show typing indicator
      document.querySelector('.typing-indicator').style.display = 'block';
      
      // Send to backend API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message
          })
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        document.querySelector('.typing-indicator').style.display = 'none';
        
        if (data.status === 'success') {
          // Format the response if it contains lists or special keywords
          if (data.message.includes('Driving Record') || data.message.includes('1.')) {
            data.message = formatChatbotOutput(data.message);
          }
          
          // Add AI response
          addMessage(data.message, 'bot');
        } else {
          addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
        }
      } catch (error) {
        console.error('Error:', error);
        document.querySelector('.typing-indicator').style.display = 'none';
        addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
      }
    }
  }
  
  // Helper function to format special outputs
  function formatChatbotOutput(text) {
    // Add any special formatting rules here
    return text;
  }
  
  // Set up event listeners
  document.querySelectorAll('.suggested-question').forEach(question => {
    question.addEventListener('click', function() {
      document.querySelector('.chat-input').value = this.textContent;
      sendMessage();
    });
  });
  
  document.querySelector('.chat-send').addEventListener('click', sendMessage);
  
  document.querySelector('.chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });