document.addEventListener("DOMContentLoaded", () => {
  const chatNowBtn = document.querySelector('a[href="{{ url_for(/marketplace) }}"]');

  if (chatNowBtn) {
    chatNowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/marketplace"; // redirect to chatbot.html via Flask
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const chatNowBtn = document.querySelector('a[href="{{ url_for(/chatbot) }}"]');

  if (chatNowBtn) {
    chatNowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/chatbot"; // redirect to chatbot.html via Flask
    });
  }
});