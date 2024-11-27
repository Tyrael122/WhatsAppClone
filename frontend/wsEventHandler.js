import {
  clearAllContacts,
  addContact,
  addReceivedMessageToPage,
  addSentMessageToPage,
  userNumber,
  obtainInputMessage,
} from "./script.js";

export class WebSocketClient {
  socket = new WebSocket("ws://localhost:8080");
  currentOutoingContact;

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

    this.socket.send(
      JSON.stringify({
        eventType: "MESSAGE",
        from: userNumber,
        to: this.currentOutoingContact,
        isGroup: false,
        message: inputMessage,
      })
    );
  }

  handleCurrentOutgoingContactChanged(userName) {
    this.currentOutoingContact = userName;

    this.#requestMessageHistory();
  }

  #handleEventReceived(event) {
    if (!event.eventType) {
      return;
    }

    switch (event.eventType) {
      case "SYNC_USERS":
        this.#syncContacts(event.registeredUsers);
        break;

      case "INCOMING_MESSAGE":
        if (!this.currentOutoingContact) return;
        addReceivedMessageToPage(event.message);

      case "MESSAGE_HISTORY":
        this.#addMessagesToPage(event.messages);

      default:
        break;
    }
  }

  #syncContacts(newContacts) {
    clearAllContacts();

    for (const contact of newContacts) {
      if (contact === userNumber) continue;

      addContact(contact);
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

  #requestMessageHistory() {
    this.socket.send(
      JSON.stringify({
        eventType: "MESSAGE_HISTORY_REQUEST",
        chat: [userNumber, this.currentOutoingContact].sort().join("-"),
      })
    );
  }
}
