// SYSTÈME DE CHATBOT INTELLIGENT AVEC SUPPORT MULTILINGUE
class Chatbot {
  constructor() {
    this.config = {
      apiUrl:
        (typeof APP_CONFIG !== "undefined"
          ? APP_CONFIG.API_BASE_URL
          : "http://localhost:5000/api") + "/chatbot/message",
      maxHistory: 20,
      typingDelay: 1000,
      welcomeDelay: 1000,
    };
    this.isOpen = false;
    this.isTyping = false;
    this.conversationHistory = [];
    this.currentLanguage = chuApp.languageManager.getCurrentLanguage();
    this.initializeResponses();
    this.init();
  }

  initializeResponses() {
    this.responses = {
      fr: {
        quickActions: [
          "Prendre rendez-vous",
          "Horaires d'ouverture",
          "Services médicaux",
          "Urgences",
          "Contact",
        ],
        welcome:
          "Bonjour ! Je suis l'assistant du CHU Yaoundé. 🤖\n\nJe peux vous aider à :\n• Prendre rendez-vous\n• Vous orienter vers nos services\n• Vous donner nos horaires et contacts\n• Répondre à vos questions pratiques\n\nComment puis-je vous aider aujourd'hui ?",
        typing: "Assistant CHU tape...",
        send: "Envoyer",
        inputPlaceholder: "Tapez votre message...",
        headerTitle: "Assistant CHU",
        headerSubtitle: "Comment puis-je vous aider ?",
        "welcome-message":
          "Bonjour ! Je suis l'assistant du CHU Yaoundé. Comment puis-je vous aider aujourd'hui ?",
        "chat-placeholder": "Tapez votre message...",

        // Réponses aux intentions
        bonjour:
          "Bonjour ! Je suis l'assistant du CHU Yaoundé. Comment puis-je vous aider aujourd'hui ?",
        salut:
          "Bonjour ! Je suis l'assistant du CHU Yaoundé. Comment puis-je vous aider aujourd'hui ?",
        coucou:
          "Bonjour ! Je suis l'assistant du CHU Yaoundé. Comment puis-je vous aider aujourd'hui ?",
        rdv: "Je peux vous aider à prendre rendez-vous. Quel service vous intéresse ? Vous pouvez aussi utiliser notre plateforme en ligne.",
        rendez:
          "Je peux vous aider à prendre rendez-vous. Quel service vous intéresse ?",
        "prendre rendez":
          "Je peux vous aider à prendre rendez-vous. Quel service vous intéresse ?",
        urgence:
          "Pour les urgences médicales, composez le **651 94 80 64** ou présentez-vous directement aux urgences du CHU. En cas d'urgence vitale, appelez immédiatement le SAMU.",
        urgent:
          "Pour les urgences médicales, composez le **651 94 80 64** ou présentez-vous directement aux urgences du CHU.",
        heure:
          "Nos horaires d'ouverture sont :\n• **Lundi - Vendredi** : 7h30 - 17h30\n• **Samedi** : 8h00 - 12h00\n• **Urgences** : 24h/24, 7j/7",
        horaire:
          "Nos horaires d'ouverture sont :\n• **Lundi - Vendredi** : 7h30 - 17h30\n• **Samedi** : 8h00 - 12h00\n• **Urgences** : 24h/24, 7j/7",
        ouvert:
          "Nos horaires d'ouverture sont :\n• **Lundi - Vendredi** : 7h30 - 17h30\n• **Samedi** : 8h00 - 12h00\n• **Urgences** : 24h/24, 7j/7",
        service:
          "Nous proposons de nombreux services spécialisés : cardiologie, pédiatrie, chirurgie, neurologie, et bien d'autres. Lequel vous intéresse particulièrement ?",
        spécialité:
          "Nous proposons de nombreux services spécialisés : cardiologie, pédiatrie, chirurgie, neurologie, et bien d'autres. Lequel vous intéresse particulièrement ?",
        contact:
          "Vous pouvez nous contacter :\n• **Téléphone** : +237 XXX XXX XXX\n• **Email** : chudeyaounde@gmail.com\n• **Urgences** : 651 94 80 64\n• **Adresse** : Yaoundé, Cameroun",
        appeler:
          "Vous pouvez nous appeler au **+237 XXX XXX XXX**. Pour les urgences, composez le **651 94 80 64**.",
        email: "Notre adresse email est **chudeyaounde@gmail.com**.",
        merci:
          "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
        "au revoir": "Au revoir ! Prenez soin de vous.",
        bye: "Au revoir ! Prenez soin de vous.",
        default:
          'Je comprends votre demande. Pour une assistance plus précise, je vous recommande de :\n• Consulter notre page "Services" pour les spécialités médicales\n• Utiliser notre plateforme de prise de rendez-vous en ligne\n• Contacter directement notre standard au **+237 XXX XXX XXX**\n\nComment puis-je vous aider autrement ?',
      },
      en: {
        quickActions: [
          "Make an appointment",
          "Opening hours",
          "Medical services",
          "Emergency",
          "Contact",
        ],
        welcome:
          "Hello! I'm the CHU Yaoundé assistant. 🤖\n\nI can help you with:\n• Making appointments\n• Guiding you to our services\n• Providing our hours and contacts\n• Answering your practical questions\n\nHow can I help you today?",
        typing: "CHU Assistant is typing...",
        send: "Send",
        inputPlaceholder: "Type your message...",
        headerTitle: "CHU Assistant",
        headerSubtitle: "How can I help you?",
        "welcome-message":
          "Hello! I'm the CHU Yaoundé assistant. How can I help you today?",
        "chat-placeholder": "Type your message...",

        // Response to intents
        hello:
          "Hello! I'm the CHU Yaoundé assistant. How can I help you today?",
        hi: "Hello! I'm the CHU Yaoundé assistant. How can I help you today?",
        hey: "Hello! I'm the CHU Yaoundé assistant. How can I help you today?",
        appointment:
          "I can help you make an appointment. Which service are you interested in? You can also use our online platform.",
        "make appointment":
          "I can help you make an appointment. Which service are you interested in?",
        emergency:
          "For medical emergencies, dial **651 94 80 64** or go directly to the CHU emergency department. In case of life-threatening emergency, call SAMU immediately.",
        urgent:
          "For medical emergencies, dial **651 94 80 64** or go directly to the CHU emergency department.",
        hour: "Our opening hours are:\n• **Monday - Friday**: 7:30 AM - 5:30 PM\n• **Saturday**: 8:00 AM - 12:00 PM\n• **Emergency**: 24/7",
        opening:
          "Our opening hours are:\n• **Monday - Friday**: 7:30 AM - 5:30 PM\n• **Saturday**: 8:00 AM - 12:00 PM\n• **Emergency**: 24/7",
        service:
          "We offer many specialized services: cardiology, pediatrics, surgery, neurology, and many more. Which one particularly interests you?",
        specialty:
          "We offer many specialized services: cardiology, pediatrics, surgery, neurology, and many more. Which one particularly interests you?",
        contact:
          "You can contact us:\n• **Phone**: +237 XXX XXX XXX\n• **Email**: chudeyaounde@gmail.com\n• **Emergency**: 651 94 80 64\n• **Address**: Yaoundé, Cameroon",
        call: "You can call us at **+237 XXX XXX XXX**. For emergencies, dial **651 94 80 64**.",
        email: "Our email address is **chudeyaounde@gmail.com**.",
        thank: "You're welcome! Feel free to ask if you have other questions.",
        goodbye: "Goodbye! Take care of yourself.",
        bye: "Goodbye! Take care of yourself.",
        default:
          'I understand your request. For more specific assistance, I recommend you to:\n• Check our "Services" page for medical specialties\n• Use our online appointment platform\n• Contact our switchboard directly at **+237 XXX XXX XXX**\n\nHow else can I help you?',
      },
    };
  }

  setLanguage(lang) {
    console.log("Changement de langue chatbot:", lang);
    if (this.responses[lang]) {
      this.currentLanguage = lang;
      this.updateChatbotInterface();
      this.trackEvent("language_changed", { language: lang });
    }
  }

  updateChatbotInterface() {
    const currentLangData = this.responses[this.currentLanguage];
    console.log("Mise à jour interface chatbot:", this.currentLanguage);

    if (!currentLangData) return;

    // Mettre à jour le header du chatbot
    const chatHeader = document.querySelector(".chat-header h6");
    if (chatHeader) {
      chatHeader.innerHTML = `<i class="fas fa-robot me-2"></i>${currentLangData.headerTitle}`;
    }

    const chatSubtitle = document.querySelector(".chat-header small");
    if (chatSubtitle) {
      chatSubtitle.textContent = currentLangData.headerSubtitle;
    }

    // Mettre à jour le placeholder
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
      chatInput.placeholder = currentLangData.inputPlaceholder;
      chatInput.setAttribute("data-translate", "chat-placeholder");
    }

    // Mettre à jour le texte du bouton d'envoi
    const sendButton = document.getElementById("sendMessage");
    if (sendButton) {
      sendButton.innerHTML = `<i class="fas fa-paper-plane"></i>`;
      sendButton.setAttribute("aria-label", currentLangData.send);
    }

    // Mettre à jour le message de bienvenue
    const welcomeMessage = document.querySelector(
      '.bot-message[data-translate="welcome-message"]',
    );
    if (welcomeMessage) {
      welcomeMessage.textContent = currentLangData["welcome-message"];
    }

    // Mettre à jour les actions rapides
    this.setupQuickActions();
  }

  async init() {
    this.setupChatbotToggle();
    this.setupMessageSending();
    this.setupQuickActions();
    this.loadWelcomeMessage();
    this.setupPersistence();
    this.setupAnalytics();

    // Synchroniser avec la langue de l'application
    this.currentLanguage = chuApp.languageManager.getCurrentLanguage();
    this.updateChatbotInterface();
  }

  setupChatbotToggle() {
    const chatbotToggle = document.getElementById("chatbotToggle");
    const chatbotContainer = document.getElementById("chatbotContainer");

    if (chatbotToggle && chatbotContainer) {
      chatbotToggle.addEventListener("click", () => this.toggleChatbot());

      // Animation d'entrée
      chatbotToggle.classList.add("pulse");
    }
  }

  setupMessageSending() {
    const sendMessage = document.getElementById("sendMessage");
    const chatInput = document.getElementById("chatInput");

    if (sendMessage && chatInput) {
      sendMessage.addEventListener("click", () => this.sendMessage());
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize pour les messages longs
      chatInput.addEventListener("input", () => {
        this.autoResizeTextarea(chatInput);
      });
    }
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  setupQuickActions() {
    const quickActionsContainer = document.getElementById("quickActions");
    const currentLangData = this.responses[this.currentLanguage];

    if (quickActionsContainer && currentLangData.quickActions) {
      quickActionsContainer.innerHTML = currentLangData.quickActions
        .map(
          (action) => `
                <button class="quick-action-btn" onclick="chatbot.handleQuickAction('${action}')">
                    ${action}
                </button>
            `,
        )
        .join("");
    }
  }

  setupPersistence() {
    // Charger l'historique depuis le localStorage
    const savedHistory = chuApp.getLocalStorage("chatbot_history");
    if (savedHistory) {
      this.conversationHistory = savedHistory;
      this.renderHistory();
    }
  }

  setupAnalytics() {
    // Track chatbot usage
    this.trackEvent("chatbot_loaded");
  }

  toggleChatbot() {
    const chatbotContainer = document.getElementById("chatbotContainer");
    const chatbotToggle = document.getElementById("chatbotToggle");

    this.isOpen = !this.isOpen;
    chatbotContainer.classList.toggle("open");

    if (this.isOpen) {
      document.getElementById("chatInput").focus();
      this.trackEvent("chatbot_opened");

      // Arrêter l'animation de pulse
      chatbotToggle.classList.remove("pulse");
    } else {
      this.trackEvent("chatbot_closed");
    }
  }

  async sendMessage() {
    const chatInput = document.getElementById("chatInput");
    const message = chatInput.value.trim();

    if (!message) return;

    // Ajouter message utilisateur
    this.addMessage(message, "user");
    chatInput.value = "";

    // Réinitialiser la hauteur du textarea
    chatInput.style.height = "auto";

    // Montrer l'indicateur de frappe
    this.showTypingIndicator();

    try {
      // Traiter le message
      const response = await this.processMessage(message);
      this.hideTypingIndicator();
      this.addMessage(response, "bot");

      // Track successful interaction
      this.trackEvent("message_sent", { message_length: message.length });
    } catch (error) {
      this.hideTypingIndicator();
      const errorMessage =
        this.currentLanguage === "fr"
          ? "Je rencontre des difficultés techniques. Veuillez réessayer ou contacter notre standard."
          : "I'm experiencing technical difficulties. Please try again or contact our switchboard.";
      this.addMessage(errorMessage, "bot");
      this.trackEvent("chatbot_error", { error: error.message });
    }
  }

  async processMessage(message) {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          // On tronque les longues reponses bot dans l'historique
          // pour eviter que le LLM se base sur d'anciennes listes
          // de services qui peuvent etre obsoletes.
          history: this.conversationHistory.slice(-6).map((h) => ({
            ...h,
            text:
              h.sender === "bot" && h.text.length > 300
                ? h.text.slice(0, 300) + "...[reponse tronquee]"
                : h.text,
          })),
          context: this.getContext(),
        }),
      });

      if (!response.ok) throw new Error("API response not ok");

      const data = await response.json();
      return (
        (data.data && data.data.message) || this.getFallbackResponse(message)
      );
    } catch (error) {
      console.error("Chatbot API error:", error);
      return this.getFallbackResponse(message);
    }
  }

  getContext() {
    return {
      page: window.location.pathname,
      language: this.currentLanguage,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }

  getFallbackResponse(message) {
    const messageLower = message.toLowerCase();
    const langResponses =
      this.responses[this.currentLanguage] || this.responses.fr;

    for (const [keyword, response] of Object.entries(langResponses)) {
      if (messageLower.includes(keyword)) {
        return response;
      }
    }

    return langResponses.default;
  }

  handleQuickAction(action) {
    this.addMessage(action, "user");
    this.showTypingIndicator();

    setTimeout(() => {
      const response = this.getFallbackResponse(action);
      this.hideTypingIndicator();
      this.addMessage(response, "bot");
    }, this.config.typingDelay);
  }

  addMessage(text, sender) {
    const chatMessages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");

    messageDiv.className = `message ${sender}-message fade-in`;

    // Formater le texte avec support markdown basique
    const formattedText = this.formatMessage(text);
    messageDiv.innerHTML = formattedText;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Sauvegarder dans l'historique
    this.conversationHistory.push({
      text,
      sender,
      timestamp: new Date().toISOString(),
      formattedText,
      language: this.currentLanguage,
    });

    // Limiter l'historique
    if (this.conversationHistory.length > this.config.maxHistory) {
      this.conversationHistory = this.conversationHistory.slice(
        -this.config.maxHistory,
      );
    }

    // Sauvegarder dans le localStorage
    chuApp.setLocalStorage(
      "chatbot_history",
      this.conversationHistory,
      7 * 24 * 60 * 60 * 1000,
    ); // 7 jours
  }

  formatMessage(text) {
    // Support markdown basique
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/(\d{3}[\s-]?\d{3}[\s-]?\d{3})/g, "<strong>$1</strong>");
  }

  showTypingIndicator() {
    const chatMessages = document.getElementById("chatMessages");
    const typingDiv = document.createElement("div");

    typingDiv.id = "typing-indicator";
    typingDiv.className = "typing-indicator";
    typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    this.isTyping = true;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  renderHistory() {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    // Nettoyer les messages existants (sauf le message de bienvenue)
    const existingMessages = chatMessages.querySelectorAll(".message");
    if (existingMessages.length > 1) {
      for (let i = 1; i < existingMessages.length; i++) {
        existingMessages[i].remove();
      }
    }

    // Ajouter l'historique
    this.conversationHistory.forEach((msg) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${msg.sender}-message`;
      messageDiv.innerHTML = msg.formattedText || this.formatMessage(msg.text);
      chatMessages.appendChild(messageDiv);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  loadWelcomeMessage() {
    // Message de bienvenue automatique après délai
    setTimeout(() => {
      if (this.conversationHistory.length === 0) {
        const welcomeMessage =
          this.responses[this.currentLanguage]["welcome-message"];
        this.addMessage(welcomeMessage, "bot");
      }
    }, this.config.welcomeDelay);
  }

  clearHistory() {
    this.conversationHistory = [];
    chuApp.setLocalStorage("chatbot_history", []);
    this.renderHistory();
    this.loadWelcomeMessage();
  }

  trackEvent(action, params = {}) {
    // Analytics
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: "chatbot",
        ...params,
      });
    }
  }

  // Export de la conversation
  exportConversation() {
    const conversationText = this.conversationHistory
      .map(
        (msg) => `${msg.sender === "user" ? "Vous" : "Assistant"}: ${msg.text}`,
      )
      .join("\n\n");

    const blob = new Blob([conversationText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-chu-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialisation chatbot
const chatbot = new Chatbot();

// Synchronisation avec le changement de langue global
chuApp.languageManager.updateChatbotLanguage = function () {
  if (window.chatbot) {
    chatbot.setLanguage(this.currentLang);
  }
};

// Commandes globales du chatbot
document.addEventListener("keydown", (e) => {
  // Ctrl+Shift+C pour ouvrir/fermer le chatbot
  if (e.ctrlKey && e.shiftKey && e.key === "C") {
    e.preventDefault();
    chatbot.toggleChatbot();
  }
});
