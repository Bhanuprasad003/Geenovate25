// Function to add a message to the chat interface
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

// Function to handle PDF file uploads and process them
function handlePdfUpload() {
  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf';
  fileInput.style.display = 'none';
  fileInput.multiple = false;
  
  // Append to document temporarily
  document.body.appendChild(fileInput);
  
  // Trigger file selection dialog
  fileInput.click();
  
  // Handle file selection
  fileInput.addEventListener('change', async function() {
    if (fileInput.files.length === 0) {
      document.body.removeChild(fileInput);
      return;
    }
    
    const file = fileInput.files[0];
    
    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      addMessage("Please upload a PDF file only.", 'bot');
      document.body.removeChild(fileInput);
      return;
    }
    
    // Show user message about the upload
    addMessage(`Uploading document: ${file.name}`, 'user');
    
    // Show typing indicator
    document.querySelector('.typing-indicator').style.display = 'block';
    
    // Create FormData object
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      console.log('Sending PDF to server...');
      // Send to backend API
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      });
      
      console.log('Server response received:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      // Hide typing indicator
      document.querySelector('.typing-indicator').style.display = 'none';
      
      if (data.status === 'success') {
        // Display the results in chat
        addMessage(data.message, 'bot');
      } else {
        addMessage("I couldn't process your PDF file. Please try again or upload a different file.", 'bot');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      document.querySelector('.typing-indicator').style.display = 'none';
      addMessage("There was an error processing your PDF file. Please try again later.", 'bot');
    }
    
    // Remove the file input
    document.body.removeChild(fileInput);
  });
}

// Add upload button to the chat interface
function addPdfUploadButton() {
  console.log('Adding PDF upload button...');
  const chatInputContainer = document.querySelector('.chat-input-container');
  
  // Create upload button
  const uploadButton = document.createElement('button');
  uploadButton.className = 'chat-upload';
  uploadButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  `;
  uploadButton.title = "Upload PDF";
  
  // Insert before send button
  const sendButton = document.querySelector('.chat-send');
  chatInputContainer.insertBefore(uploadButton, sendButton);
  
  // Add click event
  uploadButton.addEventListener('click', handlePdfUpload);
  console.log('PDF upload button added successfully');
}

// Add CSS for the upload button
function addUploadButtonStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .chat-upload {
      background-color: #f5f5f5;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .chat-upload:hover {
      background-color: #e0e0e0;
    }
    
    .chat-upload svg {
      color: #4a6fa5;
    }
  `;
  document.head.appendChild(style);
}

// Query the Flask backend for chat messages
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

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing InsurAI chatbot interface...');
  
  // Add PDF upload button
  addPdfUploadButton();
  
  // Add styles
  addUploadButtonStyles();
  
  // Add a suggested question for PDF uploads
  const suggestedQuestionsContainer = document.querySelector('.sidebar-section:first-child');
  if (suggestedQuestionsContainer) {
    const pdfSuggestion = document.createElement('div');
    pdfSuggestion.className = 'suggested-question';
    pdfSuggestion.textContent = "Upload my insurance document for analysis";
    pdfSuggestion.addEventListener('click', handlePdfUpload);
    suggestedQuestionsContainer.appendChild(pdfSuggestion);
  }
  
  // Set up event listeners for existing elements
  document.querySelectorAll('.suggested-question').forEach(question => {
    question.addEventListener('click', function() {
      document.querySelector('.chat-input').value = this.textContent;
      sendMessage();
    });
  });
  
  const sendButton = document.querySelector('.chat-send');
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }
  
  const chatInput = document.querySelector('.chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  console.log('InsurAI chatbot interface initialized successfully');
});