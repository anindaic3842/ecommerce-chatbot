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
        bot: 'bot-message',
        user: 'user-message',
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

        if (isHTML(text)) {
            messageElement.innerHTML = text; // Render as HTML
        } else {
            messageElement.textContent = text; // Render as plain text
        }

        //messageElement.textContent = text;
        messageContainer.appendChild(messageElement);
        scrollToBottom();
    }
    // This function is to detect whether the content is plain text or HTML text
    function isHTML(content) {
        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(content, 'text/html');
        // If the parsed content has any nodes under the body tag, it's HTML
        return Array.from(parsedDocument.body.childNodes).some(node => node.nodeType === 1);
    }

    // Scroll to bottom of chat window
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
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

    // Function to get or create the session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = generateSessionId();
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    function generateSessionId() {
        return uuid.v4();
    }

    async function sendServerMessage(usermessage) {
        try {
            debugger;

            const sessionId = getSessionId();

            const response = await fetch('https://ai-customer-chatbot.ue.r.appspot.com/dialogflow/detectIntent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'http: //localhost',
                    'Referer': 'http: //localhost/'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    queryResult: {
                        queryText: usermessage
                    }
                })
            });
            const result = await response.json();
            if (result.quickReplies) {
                displayQuickReplies(result.quickReplies, result.requestAppendMessage);
            }
            if (result.fulfillmentText && result.fulfillmentText.length > 0) {
                result.fulfillmentText.forEach(msg => {
                    appendMessage(msg, MessageType.bot);
                });
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Sorry, something went wrong. Please try again later.', MessageType.bot);
        }
    }

    // function displayQuickReplies(quickRepliesList, requestText) {
    //     debugger;
    //     // Get the div element where the ordered list will be added
    //     //const quickRepliesContainer = document.getElementById("quick-replies");
    //     quickReplies.innerHTML = ""; // Clear any existing content
    //     showQuickReplies();
    //     // Create an ordered list element
    //     const ol = document.createElement("ol");
    //     ol.id = "quick-replies-list"; // Optional: Add an ID to the <ol> for styling

    //     // Loop through the quickReplies array and create <li> elements for each reply
    //     quickRepliesList.forEach(reply => {
    //         const listItem = document.createElement("li");
    //         listItem.textContent = reply;
    //         listItem.classList.add("quick-reply-button");

    //         // Add an event listener for when the user clicks on the list item
    //         listItem.addEventListener("click", () => {
    //             handleQuickReplyClick(reply, requestText);
    //         });

    //         // Append the list item to the ordered list
    //         ol.appendChild(listItem);
    //     });

    //     // Append the ordered list to the div
    //     quickReplies.appendChild(ol);
    // }

    function displayQuickReplies(quickRepliesList, requestText) {
        // Clear any existing content
        quickReplies.innerHTML = ""; 
        showQuickReplies();
    
        // Create a container div for the quick replies
        const quickRepliesContainer = document.createElement("div");
        quickRepliesContainer.id = "quick-replies"; // Optional: Add an ID for styling
    
        // Apply the quick-replies CSS styles
        quickRepliesContainer.style.display = "flex";          // Enables Flexbox layout
        quickRepliesContainer.style.flexWrap = "wrap";         // Allows buttons to wrap to the next line
        quickRepliesContainer.style.padding = "10px";          // Adds space around the container content
        quickRepliesContainer.style.backgroundColor = "#f8f9fa"; // Background color for the quick replies area
        quickRepliesContainer.style.borderTop = "1px solid #e0e0e0"; // Optional: Top border for separation
    
        // Loop through the quickReplies array and create buttons for each reply
        quickRepliesList.forEach(reply => {
            const button = document.createElement("button");
            button.textContent = reply;
            button.classList.add("quick-reply-button");
    
            // Add an event listener for when the user clicks on the button
            button.addEventListener("click", () => {
                handleQuickReplyClick(reply, requestText);
            });
    
            // Append the button to the container
            quickRepliesContainer.appendChild(button);
        });
    
        // Append the container to the quickReplies div
        quickReplies.appendChild(quickRepliesContainer);
    }

    function handleQuickReplyClick(reply, requestText) {
        debugger;
        appendMessage(reply, MessageType.user);
        hideQuickReplies(); // Hide quick replies after a selection
        showTypingIndicator(); // Show typing indicator
        setTimeout(() => {
            sendServerMessage((requestText + reply).trim());
            hideTypingIndicator(); // Hide typing indicator after bot responds
        }, 1500);
    }

    // function displayProductInfoFromText(responseText) {
    //     const messageContainer = document.getElementById('message-container');

    //     // Define the regex patterns for each piece of information
    //     const descriptionPattern = /- \*\*Description:\*\* (.*?) - \*\*Price:\*\*/;
    //     const pricePattern = /- \*\*Price:\*\* (.*?) - \*\*Availability:\*\*/;
    //     const availabilityPattern = /- \*\*Availability:\*\* (\d+)/;

    //     // Extract the information using the regex patterns
    //     const description = (responseText.match(descriptionPattern) || [])[1] || "No description available.";
    //     const price = (responseText.match(pricePattern) || [])[1] || "N/A";
    //     const availability = (responseText.match(availabilityPattern) || [])[1] || "N/A";

    //     // Create the HTML structure dynamically
    //     const productInfoHtml = `
    //         <div class="product-info">
    //             <p><strong>Description:</strong> ${description}</p>
    //             <p><strong>Price:</strong> ${price}</p>
    //             <p><strong>Availability:</strong> ${availability}</p>
    //             <p>Would you like to purchase this product, or go back to the product list?</p>
    //         </div>
    //     `;

    //     // Create a container for the message and append it to the message container
    //     const messageElement = document.createElement('div');
    //     messageElement.innerHTML = productInfoHtml;
    //     messageContainer.appendChild(messageElement);

    //     // Scroll to the bottom of the chat window to show the new message
    //     messageContainer.scrollTop = messageContainer.scrollHeight;
    // }

});