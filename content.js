// Content script to extract Discord token and channel ID
function getToken() {
    return window.localStorage.getItem('token').replace(/"/g, '');
}

function getChannelId() {
    const match = window.location.href.match(/channels\/(\d+|@me)\/(\d+)/);
    return match ? match[2] : null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "grabTokenAndChannelId") {
        const token = getToken();
        const channelId = getChannelId();
        sendResponse({ token, channelId });
    }
});

// Run the extraction function when the page loads
window.addEventListener('load', () => {
    const token = getToken();
    const channelId = getChannelId();
    if (token && channelId) {
        chrome.runtime.sendMessage({
            action: 'setTokenAndChannelId',
            token: token,
            channelId: channelId
        });
    }
});