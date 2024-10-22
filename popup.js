// Function to update the status indicator
function updateStatus(status) {
    const statusIndicator = document.getElementById('status');
    const deleteButton = document.getElementById('deleteButton');

    if (status && status.token && status.channelId) {
        statusIndicator.classList.add('ready');
        deleteButton.disabled = false;
    } else {
        statusIndicator.classList.remove('ready');
        deleteButton.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const deleteButton = document.getElementById('deleteButton');
    const statusIndicator = document.getElementById('status');

    // Check initial status
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
        if (chrome.runtime.lastError) {
            console.error('Error getting status:', chrome.runtime.lastError);
        } else {
            updateStatus(response);
        }
    });

    // Listen for status updates
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'statusUpdate') {
            updateStatus(request);
        }
    });

    deleteButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'deleteMessages'});
    });
});