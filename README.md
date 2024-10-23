# Discord Message Deleter Extension
This browser extension allows you to delete messages in a Discord channel or DM. You can filter messages by a keyword and view real-time statistics on the number of messages processed and deleted.

## Features
- **Token and Channel ID Detection**: Automatically grabs your Discord token and channel ID when you open the extension.
- **Keyword Filtering**: Optionally enter a keyword to only delete messages containing that keyword.
- **Real-time Statistics**: View the total number of messages processed and deleted in real-time.

## Installation
1. Clone this repository to your local machine.
2. Open your browser and navigate to the extensions page (e.g., `chrome://extensions`).
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing this extension.

## Usage
1. Navigate to a Discord channel or DM in your browser.
2. Click the extension icon to open the popup.
3. Click "Grab Token and Channel ID" to detect your Discord token and channel ID.
4. Optionally, enter a keyword in the "Enter keyword to filter" field to delete only messages containing that keyword.
5. Click "Delete Messages" to start the deletion process.
6. Monitor the real-time statistics to see how many messages have been processed and deleted.

## Note
- This extension uses your Discord token to authenticate API requests. Be cautious with your token and do not share it with others.
- Deleting a large number of messages may take some time due to Discord's rate limits.

## Disclaimer
This extension is intended for educational purposes only. Use it at your own risk. The author is not responsible for any consequences resulting from its use.