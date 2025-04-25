// homepage.js

document.addEventListener("DOMContentLoaded", () => {
    const chatNowBtn = document.querySelector('a[href="chatbot.html"]');
  
    if (chatNowBtn) {
      chatNowBtn.addEventListener("click", (e) => {
        e.preventDefault();  // Stop default anchor jump
        window.location.href = "/chatbot";  // Redirect to chatbot page
      });
    }
  });
  