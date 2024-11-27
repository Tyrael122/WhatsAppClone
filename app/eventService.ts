import WebSocket from "ws";
import {
  Chat,
  MessageHistoryRequest,
  RegisterEvent,
  WhatsAppMessageEvent,
} from "./model";
import { broadcastExcludingItself } from "./server";

export class EventService {
  userConnectionMap: Map<string, WebSocket> = new Map();

  chatMap: Map<string, Chat> = new Map();

  handleRegistering(event: RegisterEvent, wsConnection: WebSocket) {
    const userName = event.name;
    console.log(`Registering user ${userName}`);

    this.userConnectionMap.set(userName, wsConnection);

    const registeredUsers = this.#obtainExistingUsers();

    wsConnection.send(
      JSON.stringify(this.#createAddUserEvent(registeredUsers))
    );

    broadcastExcludingItself(
      JSON.stringify(this.#createAddUserEvent(registeredUsers)),
      wsConnection
    );
  }

  handleMessage(event: WhatsAppMessageEvent) {
    const chatId = event.isGroup
      ? event.to
      : [event.from, event.to].sort().join("-");

    if (!this.chatMap.has(chatId)) {
      const chatUsers = [event.from];
      if (!event.isGroup) chatUsers.push(event.to);

      const newChat = new Chat(chatId, chatUsers);

      this.chatMap.set(chatId, newChat);
    }

    const chat = this.chatMap.get(chatId);
    if (!chat) return;

    chat.addMessage({
      from: event.from,
      message: event.message,
    });

    for (const user of chat.users) {
      if (user === event.from) continue;

      this.#sendToUser(
        user,
        JSON.stringify({
          eventType: "INCOMING_MESSAGE",
          message: event.message,
        })
      );
    }
  }

  handleMessageHistoryRequest(
    event: MessageHistoryRequest,
    wsConnection: WebSocket
  ) {
    const messages = this.chatMap.get(event.chat)?.messages;
    if (!messages) return;

    wsConnection.send(
      JSON.stringify({ eventType: "MESSAGE_HISTORY", messages: messages })
    );
  }

  #obtainExistingUsers(): string[] {
    let registeredUsers = [];

    for (const [
      existingUsername,
      existingConnection,
    ] of this.userConnectionMap.entries()) {
      if (existingConnection.readyState !== WebSocket.OPEN) continue;

      registeredUsers.push(existingUsername);
    }

    return registeredUsers;
  }

  #createAddUserEvent(usernames: string[]) {
    return { eventType: "SYNC_USERS", registeredUsers: usernames };
  }

  #sendToUser(user: string, data: string) {
    this.userConnectionMap.get(user)?.send(data);
  }
}
