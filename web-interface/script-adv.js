document.addEventListener('DOMContentLoaded', function () {
    const messageContainer = document.getElementById('message-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const closeBtn = document.getElementById('close-btn');
    const feedbackForm = document.getElementById('feedback-form');
    const skipBtn = document.getElementById('skip-btn');
    const sendFeedbackBtn = document.getElementById('send-feedback-btn');
    const quickReplies = document.getElementById('quick-replies');
    const chatWindow = document.getElementById('chat-window');
    const chatbotContainer = document.getElementById('chatbot-container');
    const minimizedChatIcon = document.getElementById('minimized-chat-icon');
    const typingIndicator = document.getElementById('typing-indicator');
    const MessageType = ({
        bot : 'bot-message',
        user : 'user-message',
    });

    // Function to minimize the chat window
    function minimizeChat() {
        chatbotContainer.style.display = 'none';
        minimizedChatIcon.style.display = 'flex';
    }

    // Function to restore the chat window
    function restoreChat() {
        chatbotContainer.style.display = 'flex';
        minimizedChatIcon.style.display = 'none';
    }

    // Event listener to minimize chat when close button is clicked
    closeBtn.addEventListener('click', minimizeChat);

    // Event listener to restore chat when minimized icon is clicked
    minimizedChatIcon.addEventListener('click', restoreChat);

    // Initially hide quick replies and minimized chat icon
    quickReplies.style.display = 'none';
    minimizedChatIcon.style.display = 'none';
    typingIndicator.style.display = 'none';

    // Handle send message
    function sendMessage() {
        debugger;
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        appendMessage(userMessage, MessageType.user);
        userInput.value = '';
        hideQuickReplies(); // Hide quick replies once an option is clicked
        //processBotResponse(userMessage);
        showTypingIndicator(); // Show typing indicator
        setTimeout(() => {
            sendServerMessage(userMessage);
            hideTypingIndicator(); // Hide typing indicator after bot responds
        }, 1500); // Simulate delay for bot processing
    }

    // Append message to the chat window
    function appendMessage(text, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${className}`;
        messageElement.textContent = text;
        messageContainer.appendChild(messageElement);
        scrollToBottom();
    }

    // Scroll to bottom of chat window
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Process bot response
    function processBotResponse(userMessage) {
        let botResponse = '';

        switch (true) {
            case /track/i.test(userMessage):
                botResponse = 'Please provide your order number to track your order.';
                break;
            case /return/i.test(userMessage):
                botResponse = 'What item would you like to return?';
                break;
            case /recommend/i.test(userMessage):
                botResponse = 'Here are some product recommendations for you!';
                sendServerMessage(userMessage);
                showProductCarousel();
                break;
            case /promo/i.test(userMessage):
                botResponse = 'Enter your promo code to apply it to your cart.';
                break;
            case /help/i.test(userMessage):
                botResponse = 'How can I help you today?';
                break;
            default:
                botResponse = 'Sorry, I didn’t understand that. Can you please rephrase?';
        }

        appendMessage(botResponse, MessageType.bot);
    }

     // Show typing indicator
     function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }

    // Show quick replies after the welcome message
    function showQuickReplies() {
        quickReplies.style.display = 'flex';
    }

    // Hide quick replies after an option is clicked
    function hideQuickReplies() {
        quickReplies.style.display = 'none';
    }

    // Quick reply buttons
    document.querySelectorAll('.quick-reply-button').forEach(button => {
        button.addEventListener('click', () => {
            const reply = button.textContent.trim();
            appendMessage(reply, MessageType.user);
            hideQuickReplies(); // Hide quick replies after a selection
            //processBotResponse(reply);
            showTypingIndicator(); // Show typing indicator
            debugger;
            setTimeout(() => {
                sendServerMessage(reply);
                hideTypingIndicator(); // Hide typing indicator after bot responds
            }, 1500);
        });
    });

    // Close chatbot and minimize to icon
    closeBtn.addEventListener('click', () => {
        chatbotContainer.style.display = 'none';
        minimizedChatIcon.style.display = 'flex';
    });

    // Reopen chat window from minimized icon
    minimizedChatIcon.addEventListener('click', () => {
        chatbotContainer.style.display = 'flex';
        minimizedChatIcon.style.display = 'none';
    });

    // Send button click event
    sendBtn.addEventListener('click', sendMessage);

    // Handle enter key press
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Skip feedback
    skipBtn.addEventListener('click', () => {
        feedbackForm.classList.add('hidden');
    });

    // Send feedback
    sendFeedbackBtn.addEventListener('click', () => {
        appendMessage('Thanks for your feedback!', 'bot-message');
        feedbackForm.classList.add('hidden');
    });

    // Show welcome message and then quick replies
    setTimeout(() => {
        sendServerMessage('Hi');
        //appendMessage('Hello! How can I assist you today?', 'bot-message');
        showQuickReplies(); // Show quick replies after the welcome message
    }, 1000);

    // Simulate feedback request after a message
    //setTimeout(() => {
     //   feedbackForm.classList.remove('hidden');
    //}, 5000);

    async function sendServerMessage(usermessage) {
        try {
            debugger;
            const response = await fetch('https://ai-customer-chatbot.ue.r.appspot.com/detectIntent', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Origin':'http: //localhost',
                  'Referer' :'http: //localhost/'
                },
                body: JSON.stringify({
                  queryResult: {
                    queryText: usermessage
                  }
                })
              });
            const result = await response.json();
            appendMessage(result.fulfillmentText, MessageType.bot);
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Sorry, something went wrong. Please try again later.', MessageType.bot);
        }
    }
});