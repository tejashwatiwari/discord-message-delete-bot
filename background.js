// Placeholder for background script
// This script will handle the logic for deleting Discord messages.
// You will need to implement authentication and message deletion logic here.

// Variables to store token and channel ID
let discordToken = '';
let discordChannelId = '';

function updatePopupStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        try {
            chrome.runtime.sendMessage({
                action: 'statusUpdate',
                token: !!discordToken,
                channelId: !!discordChannelId
            }, function(response) {
                if (chrome.runtime.lastError) {
                    // Ignore the error if the popup is not open
                    console.log("Popup is not open. Status update ignored.");
                }
            });
        } catch (error) {
            console.error("Error sending status update:", error);
        }
    });
}

// Function to authenticate and delete messages
async function deleteMessages() {
    try {
        if (!discordToken || !discordChannelId) {
            throw new Error('Token or Channel ID not set');
        }

        let before = null;
        let grandTotal = 0;

        while (true) {
            const messages = await fetchMessages(before);
            if (messages.length === 0) {
                break;
            }

            grandTotal += messages.length;

            for (const message of messages) {
                await deleteMessage(message.id);
                await wait(1000); // Wait 1 second between deletions
            }

            before = messages[messages.length - 1].id;
        }
    } catch (error) {
        console.error('Error in deleteMessages:', error);
    }
}

async function fetchMessages(before = null) {
    const url = `https://discord.com/api/v9/channels/${discordChannelId}/messages?limit=100${before ? `&before=${before}` : ''}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': discordToken }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
        }

        const responseText = await response.text();
        let messages;
        try {
            messages = JSON.parse(responseText);
        } catch (error) {
            throw new Error('Failed to parse response as JSON');
        }

        if (!Array.isArray(messages)) {
            throw new Error('Unexpected response format. Expected an array of messages.');
        }

        return messages;
    } catch (error) {
        throw error;
    }
}

async function deleteMessage(messageId) {
    const url = `https://discord.com/api/v9/channels/${discordChannelId}/messages/${messageId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': discordToken }
    });

    if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status} ${response.statusText}`);
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages from content.js and popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setTokenAndChannelId') {
        discordToken = request.token;
        discordChannelId = request.channelId;
        updatePopupStatus();
    }
    if (request.action === 'deleteMessages') {
        deleteMessages();
    }
    if (request.action === 'getStatus') {
        sendResponse({
            token: !!discordToken,
            channelId: !!discordChannelId
        });
        return true; // This is important for asynchronous response
    }
});

// Initialize status
updatePopupStatus();