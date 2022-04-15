# VTelegram Extension
_Was developed for University's needs to transfer existing old chats from VK to Telegram._

## Info

VTelegram is a client-side browser extension for Google Chrome that allows to transfer selected Chat with Media content from VK (Vkontakte) to Telegram. 

In Telegram chat can be existing (with users) or blank (like chats for notes). Exports messages and content from VK with Fetch queries into new chat document, after which imports it with Telegram's MTProto API methods. Formatting is also is taken into account: replies, forwarding and messages changing have a symbolic (Skype-like) replacement.

### Media import options
- Straight import (as media files, the slowest);
- Import via VK links (links on original content, the fastest);
- Google Drive import (links on files on Drive).

Currently only **Import via VK links** option is allowed.

### Transfer process

1. Select chat in VK to transfer and open it;
2. Open the extension and login into your Telegram account;
3. Paste invitation link on the chat in Telegram or leave empty for new chat to be created;
4. Select import option for each type of media;
5. Fill in a Telegram nickname or phone for each person who you would like to link with their existing Telegram account;
6. Press **Import** and wait for import to finish.

## Usage

1. Instal **[npm](https://www.npmjs.com/package/npm)** if you don't have it;
2. Run `npm run build` in repository's directory;
3. In Google Chrome open the Extension Management page by navigating to `chrome://extensions`;
4. Enable Developer Mode by clicking the toggle switch next to **Developer mode** (if haven't yet).
5. Click the **Load unpacked** button and select the repository's directory.

## Demo

![Demo VTelegram](https://user-images.githubusercontent.com/22761161/163557411-0ee42cc3-625b-42ad-86f4-7d475ac8915c.gif)

## About authors

The project was inspired by teachers of SPbSTU. Primary authors:
* __[KostrareVI (team leader)](https://github.com/KostarevVI)__
* __[MorganGrieves](https://github.com/MorganGrieves)__
* __[D4ker](https://github.com/D4ker)__
