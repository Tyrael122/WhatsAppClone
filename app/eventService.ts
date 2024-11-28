import WebSocket from "ws";
import {
  Chat,
  CreateGroupRequest,
  MessageHistoryRequest,
  OutgoingChat,
  RegisterEvent,
  WhatsAppMessageEvent,
} from "./model";
import { broadcastExcludingItself as broadcast } from "./server";

export class EventService {
  userConnectionMap: Map<string, WebSocket> = new Map();

  chatMap: Map<string, Chat> = new Map();

  groups: string[] = [];

  handleRegistering(event: RegisterEvent, wsConnection: WebSocket) {
    const userName = event.name;
    console.log(`Registering user ${userName}`);

    this.userConnectionMap.set(userName, wsConnection);

    this.#broadcastChatList();
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

    const incomingMessageEvent = JSON.stringify({
      eventType: "INCOMING_MESSAGE",
      from: event.from,
      to: chatId,
      message: event.message,
    });

    this.#sendIncomingMessageEventToChat(chat, incomingMessageEvent, event);
  }

  handleMessageHistoryRequest(
    event: MessageHistoryRequest,
    wsConnection: WebSocket
  ) {
    const chat = this.chatMap.get(event.chat);
    if (!chat) return;

    const messages = chat.messages;
    if (!messages) return;

    wsConnection.send(
      JSON.stringify({ eventType: "MESSAGE_HISTORY", messages: messages })
    );
  }

  handleCreateGroupRequest(event: CreateGroupRequest) {
    const chatId = event.name;

    this.groups.push(event.name);

    const groupChat = new Chat(chatId, []);
    groupChat.setIsOpenGroup(true);

    this.chatMap.set(chatId, groupChat);

    this.#broadcastChatList();
  }

  #broadcastChatList() {
    const existingChats = this.#obtainExistingChats();

    broadcast(JSON.stringify(this.#createAddUserEvent(existingChats)));
  }

  #sendIncomingMessageEventToChat(
    chat: Chat,
    incomingMessageEvent: string,
    event: WhatsAppMessageEvent
  ) {
    if (chat.isOpenGroup) {
      broadcast(incomingMessageEvent);
      return;
    }

    for (const user of chat.users) {
      if (user === event.from) continue;

      this.#sendToUser(user, incomingMessageEvent);
    }
  }

  #obtainExistingChats(): OutgoingChat[] {
    let chats = [];

    for (const [
      existingUsername,
      existingConnection,
    ] of this.userConnectionMap.entries()) {
      if (existingConnection.readyState !== WebSocket.OPEN) continue;

      chats.push({ isGroup: false, name: existingUsername });
    }

    for (const group of this.groups) {
      chats.push({ isGroup: true, name: group });
    }

    return chats;
  }

  #createAddUserEvent(chats: OutgoingChat[]) {
    return { eventType: "SYNC_USERS", chats: chats };
  }

  #sendToUser(user: string, data: string) {
    this.userConnectionMap.get(user)?.send(data);
  }
}
