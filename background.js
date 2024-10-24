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

async function fetchServers() {
    try {
        const response = await fetch('https://discord.com/api/v9/users/@me/guilds', {
            headers: { 'Authorization': discordToken }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch servers: ${response.status} ${response.statusText}`);
        }

        const servers = await response.json();
        return servers.map(server => ({ id: server.id, name: server.name }));
    } catch (error) {
        console.error('Error fetching servers:', error);
        return [];
    }
}

async function fetchChannels(serverId) {
    try {
        const response = await fetch(`https://discord.com/api/v9/guilds/${serverId}/channels`, {
            headers: { 'Authorization': discordToken }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText}`);
        }

        const channels = await response.json();
        return channels.filter(channel => channel.type === 0).map(channel => ({ id: channel.id, name: channel.name }));
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
}

async function exportChat(serverId, channelId) {
    try {
        const messages = await fetchAllMessages(channelId);
        const formattedMessages = formatMessagesForExport(messages);
        chrome.runtime.sendMessage({
            action: 'downloadChat',
            content: formattedMessages,
            filename: `chat_export_${serverId}_${channelId}.txt`
        });
    } catch (error) {
        console.error('Error exporting chat:', error);
    }
}

async function fetchAllMessages(channelId) {
    let allMessages = [];
    let before = null;
    while (true) {
        const messages = await fetchMessages(before);
        if (messages.length === 0) {
            break;
        }
        allMessages = allMessages.concat(messages);
        before = messages[messages.length - 1].id;
    }
    return allMessages;
}

function formatMessagesForExport(messages) {
    return messages.reverse().map(msg => {
        const date = new Date(msg.timestamp);
        const formattedDate = date.toLocaleString();
        return `[${formattedDate}] ${msg.author.username}: ${msg.content}`;
    }).join('\n');
}

function grabTokenAndChannelId() {
    // Logic to grab token and channel ID
    // This is a placeholder for the actual implementation
    discordToken = 'fetched_token'; // Replace with actual fetching logic
    discordChannelId = 'fetched_channel_id'; // Replace with actual fetching logic
    updatePopupStatus();
    chrome.runtime.sendMessage({
        action: 'disclaimer',
        message: 'If token ID and channel ID don\'t turn green, try refreshing your Discord page.'
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'exportChat') {
        exportChat(request.serverId, request.channelId);
    }
    if (request.action === 'fetchServers') {
        fetchServers().then(servers => sendResponse({ servers })).catch(() => sendResponse({ servers: [] }));
        return true;
    }
    if (request.action === 'fetchChannels') {
        fetchChannels(request.serverId).then(channels => sendResponse({ channels })).catch(() => sendResponse({ channels: [] }));
        return true;
    }
    if (request.action === 'grabTokenAndChannelId') {
        grabTokenAndChannelId();
    }
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