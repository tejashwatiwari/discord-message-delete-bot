// Function to update the status indicator
function updateStatus(status) {
    const tokenStatus = document.getElementById('tokenStatus');
    const channelStatus = document.getElementById('channelStatus');
    const deleteButton = document.getElementById('deleteButton');

    if (status.token) {
        tokenStatus.classList.remove('red');
        tokenStatus.classList.add('green');
    } else {
        tokenStatus.classList.remove('green');
        tokenStatus.classList.add('red');
    }

    if (status.channelId) {
        channelStatus.classList.remove('red');
        channelStatus.classList.add('green');
    } else {
        channelStatus.classList.remove('green');
        channelStatus.classList.add('red');
    }

    deleteButton.disabled = !(status.token && status.channelId);
}

document.addEventListener('DOMContentLoaded', function() {
    const deleteButton = document.getElementById('deleteButton');
    const grabButton = document.getElementById('grabButton');
    const tokenStatus = document.getElementById('tokenStatus');
    const channelStatus = document.getElementById('channelStatus');
    const keywordFilter = document.getElementById('keywordFilter');
    const statsDiv = document.getElementById('stats');
    const totalProcessedSpan = document.getElementById('totalProcessed');
    const totalDeletedSpan = document.getElementById('totalDeleted');

    function updateStatus(status) {
        if (status.token) {
            tokenStatus.classList.remove('red');
            tokenStatus.classList.add('green');
        } else {
            tokenStatus.classList.remove('green');
            tokenStatus.classList.add('red');
        }

        if (status.channelId) {
            channelStatus.classList.remove('red');
            channelStatus.classList.add('green');
        } else {
            channelStatus.classList.remove('green');
            channelStatus.classList.add('red');
        }

        deleteButton.disabled = !(status.token && status.channelId);
    }

    function updateStats(stats) {
        totalProcessedSpan.textContent = stats.totalProcessed;
        totalDeletedSpan.textContent = stats.totalDeleted;
        statsDiv.style.display = 'block';
    }

    // Check initial status
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
        if (chrome.runtime.lastError) {
            console.error('Error getting status:', chrome.runtime.lastError);
        } else {
            updateStatus(response);
        }
    });

    // Listen for status updates and deletion progress
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'statusUpdate') {
            updateStatus(request);
        } else if (request.action === 'deletionProgress') {
            updateStats(request);
        }
    });

    grabButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "grabTokenAndChannelId"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                } else if (response && response.token && response.channelId) {
                    chrome.runtime.sendMessage({
                        action: 'setTokenAndChannelId',
                        token: response.token,
                        channelId: response.channelId
                    });
                }
            });
        });
    });

    deleteButton.addEventListener('click', function() {
        const keyword = keywordFilter.value.trim();
        chrome.runtime.sendMessage({
            action: 'deleteMessages',
            keyword: keyword
        });
        // Reset stats when starting a new deletion
        updateStats({totalProcessed: 0, totalDeleted: 0});
    });
});