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
    const serverSelect = document.getElementById('serverSelect');
    const channelSelect = document.getElementById('channelSelect');
    const exportServerSelect = document.getElementById('exportServerSelect');
    const exportChannelSelect = document.getElementById('exportChannelSelect');
    const exportButton = document.getElementById('exportButton');
    const statsDiv = document.getElementById('stats');
    const totalProcessedSpan = document.getElementById('totalProcessed');
    const totalDeletedSpan = document.getElementById('totalDeleted');

    function updateStatus(status) {
        if (status.token) {
            tokenStatus.classList.remove('red');
            tokenStatus.classList.add('green');
            fetchServers();
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

    function fetchServers() {
        chrome.runtime.sendMessage({action: 'fetchServers'}, function(response) {
            if (response && response.servers) {
                populateDropdown(serverSelect, response.servers);
                populateDropdown(exportServerSelect, response.servers);
            }
        });
    }

    function populateDropdown(dropdown, items) {
        dropdown.innerHTML = '<option value="">Select</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            dropdown.appendChild(option);
        });
    }

    serverSelect.addEventListener('change', function() {
        const serverId = serverSelect.value;
        if (serverId) {
            chrome.runtime.sendMessage({action: 'fetchChannels', serverId: serverId}, function(response) {
                if (response && response.channels) {
                    populateDropdown(channelSelect, response.channels);
                }
            });
        }
    });

    exportServerSelect.addEventListener('change', function() {
        const serverId = exportServerSelect.value;
        if (serverId) {
            chrome.runtime.sendMessage({action: 'fetchChannels', serverId: serverId}, function(response) {
                if (response && response.channels) {
                    populateDropdown(exportChannelSelect, response.channels);
                }
            });
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
        const serverId = serverSelect.value;
        const channelId = channelSelect.value;
        chrome.runtime.sendMessage({
            action: 'deleteMessages',
            keyword: keyword,
            serverId: serverId,
            channelId: channelId
        });
        // Reset stats when starting a new deletion
        updateStats({totalProcessed: 0, totalDeleted: 0});
    });

    exportButton.addEventListener('click', function() {
        const serverId = exportServerSelect.value;
        const channelId = exportChannelSelect.value;
        chrome.runtime.sendMessage({
            action: 'exportChat',
            serverId: serverId,
            channelId: channelId
        });
    });

    document.getElementById('deleteTabButton').addEventListener('click', function() {
        showTab('deleteTab');
    });

    document.getElementById('exportTabButton').addEventListener('click', function() {
        showTab('exportTab');
    });

    document.getElementById('editTabButton').addEventListener('click', function() {
        showTab('editTab');
    });

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
        } else if (request.action === 'downloadChat') {
            downloadAsFile(request.content, request.filename);
        }
    });

    function downloadAsFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    window.showTab = function(tabId) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    };
});