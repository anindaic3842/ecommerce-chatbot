document.addEventListener('DOMContentLoaded', () => {
  // Initial greeting message
  const initialMessage = `
<p>Hi there! Welcome to <strong>UrbanMarket</strong>! 😊 <br/> I'm <strong>ShopBuddy</strong>, your personal shopping assistant. How can I help you today?</p>
<ol>
  <li>🛒 <strong>Browse Products</strong></li>
  <li>🔍 <strong>Search for a specific item</strong></li>
  <li>📦 <strong>Track your order</strong></li>
  <li>🏷️ <strong>Check the latest deals</strong></li>
  <li>💬 <strong>Speak to customer support</strong></li>
</ol>
<p>Please type a number or describe what you need help with.</p>
  `;
  addMessage('bot-message', initialMessage);
});

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    addMessage('user-message', userInput);
    document.getElementById('user-input').value = '';

    try {
        const response = await fetch('https://ai-customer-chatbot.ue.r.appspot.com/detectIntent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin':'http: //localhost',
              'Referer' :'http: //localhost/'
            },
            body: JSON.stringify({
              queryResult: {
                queryText: userInput
              }
            })
          });

        const result = await response.json();
        addMessage('bot-message', result.fulfillmentText);
    } catch (error) {
        console.error('Error:', error);
        addMessage('bot-message', 'Sorry, something went wrong. Please try again later.');
    }
}

function addMessage(type, text) {
    const chatMessages = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `<div class="message-text">${text}</div>`;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}