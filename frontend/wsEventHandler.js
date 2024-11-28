import {
  clearAllContacts,
  addContactToPage,
  addReceivedMessageToPage,
  addSentMessageToPage,
  userNumber,
  obtainInputMessage,
} from "./script.js";

export class WebSocketClient {
  socket = new WebSocket("ws://localhost:8080");
  currentOutoingChat;

  chatsMap = new Map();

  constructor() {
    this.socket.addEventListener("message", (event) => {
      this.#handleEventReceived(JSON.parse(event.data));
    });

    this.socket.addEventListener("open", () => {
      this.socket.send(
        JSON.stringify({ eventType: "REGISTER", name: userNumber })
      );
    });
  }

  sendMessage() {
    const inputMessage = obtainInputMessage();

    addSentMessageToPage(inputMessage);

    const isGroup = this.chatsMap.get(this.currentOutoingChat);

    this.socket.send(
      JSON.stringify({
        eventType: "MESSAGE",
        from: userNumber,
        to: this.currentOutoingChat,
        isGroup: isGroup,
        message: inputMessage,
      })
    );
  }

  handleCurrentOutgoingChatChanged(chatName) {
    this.currentOutoingChat = chatName;

    this.#requestMessageHistory(chatName);
  }

  requestGroupCreation(name) {
    this.socket.send(
      JSON.stringify({
        eventType: "CREATE_GROUP",
        name: name,
      })
    );
  }

  #handleEventReceived(event) {
    if (!event.eventType) {
      return;
    }

    const eventType = event.eventType;

    if (eventType === "SYNC_USERS") {
      this.#syncContacts(event.chats);
      return;
    }

    if (eventType === "INCOMING_MESSAGE") {
      if (!this.currentOutoingChat) return;
      if (event.from === userNumber) return;
      if (event.to !== this.currentOutoingChat) return;
      addReceivedMessageToPage(event.message);
      return;
    }

    if (eventType === "MESSAGE_HISTORY") {
      this.#addMessagesToPage(event.messages);
      return;
    }
  }

  #syncContacts(chats) {
    clearAllContacts();

    this.chatsMap.clear();

    for (const chat of chats) {
      if (chat.name === userNumber) continue;

      this.chatsMap.set(chat.name, chat.isGroup);

      addContactToPage(chat.name);
    }
  }

  #addMessagesToPage(messages) {
    for (const message of messages) {
      if (message.from === userNumber) {
        addSentMessageToPage(message.message);
      } else {
        addReceivedMessageToPage(message.message);
      }
    }
  }

  #requestMessageHistory(chatname) {
    const chatId = this.chatsMap.get(chatname)
      ? chatname
      : [userNumber, chatname].sort().join("-");

    this.socket.send(
      JSON.stringify({
        eventType: "MESSAGE_HISTORY_REQUEST",
        chat: chatId,
      })
    );
  }
}
