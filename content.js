// Content script to extract Discord token and channel ID
function extractTokenAndChannelId() {
    // Extract the token from local storage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token not found');
        return;
    }
    console.log('Extracted token:', token);
    
    // Extract the channel ID from the URL
    const channelIdMatch = window.location.href.match(/channels\/(\d+|@me)\/(\d+)/);
    if (!channelIdMatch) {
        console.error('Channel ID not found');
        return;
    }
    const channelId = channelIdMatch[2];
    console.log('Extracted channel ID:', channelId);
    
    // Send the token and channel ID to the background script
    chrome.runtime.sendMessage({
        action: 'setTokenAndChannelId',
        token: token.replace(/"/g, ''),
        channelId: channelId
    });
}

// Run the extraction function when the page loads
window.addEventListener('load', extractTokenAndChannelId);