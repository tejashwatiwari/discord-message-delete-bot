// Placeholder for background script
// This script will handle the logic for deleting Discord messages.
// You will need to implement authentication and message deletion logic here.

// Variables to store token and channel ID
let discordToken = '';
let discordChannelId = '';

function updatePopupStatus() {
    chrome.runtime.sendMessage({
        action: 'statusUpdate',
        token: !!discordToken,
        channelId: !!discordChannelId
    }, function(response) {
        if (chrome.runtime.lastError) {
            console.log("Popup is not open. Status update ignored.");
        }
    });
}

function updateDeletionProgress(totalProcessed, totalDeleted) {
    chrome.runtime.sendMessage({
        action: 'deletionProgress',
        totalProcessed: totalProcessed,
        totalDeleted: totalDeleted
    }, function(response) {
        if (chrome.runtime.lastError) {
            console.log("Popup is not open. Progress update ignored.");
        }
    });
}

// Function to authenticate and delete messages
async function deleteMessages(keyword = '') {
    try {
        if (!discordToken || !discordChannelId) {
            throw new Error('Token or Channel ID not set');
        }

        let before = null;
        let grandTotal = 0;
        let deletedTotal = 0;

        while (true) {
            const messages = await fetchMessages(before);
            if (messages.length === 0) {
                break;
            }

            grandTotal += messages.length;

            for (const message of messages) {
                if (!keyword || (message.content && message.content.toLowerCase().includes(keyword.toLowerCase()))) {
                    await deleteMessage(message.id);
                    deletedTotal++;
                    await wait(1000); // Wait 1 second between deletions
                }
                updateDeletionProgress(grandTotal, deletedTotal);
            }

            before = messages[messages.length - 1].id;
        }

        console.log(`Finished deleting messages. Total processed: ${grandTotal}, Total deleted: ${deletedTotal}`);
    } catch (error) {
        console.error('Error in deleteMessages:', error);
    }
}

async function fetchMessages(before = null) {
    const url = `https://discord.com/api/v9/channels/${discordChannelId}/messages?limit=100${before ? `&before=${before}` : ''}`;
    const response = await fetch(url, {
        headers: { 'Authorization': discordToken }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
        deleteMessages(request.keyword);
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