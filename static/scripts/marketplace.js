document.addEventListener("DOMContentLoaded", () => {
    const chatNowBtn = document.querySelector('a[href="{{ url_for(/index) }}"]');
  
    if (chatNowBtn) {
      chatNowBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/index";
      });
    }
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const chatNowBtn = document.querySelector('a[href="{{ url_for(/chatbot) }}"]');
  
    if (chatNowBtn) {
      chatNowBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/chatbot";
      });
    }
  });