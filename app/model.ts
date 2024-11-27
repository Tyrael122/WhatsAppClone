export interface WhatsAppEvent {
  eventType: IncomingEventType;
}

export interface RegisterEvent extends WhatsAppEvent {
  name: string;
}

export interface WhatsAppMessageEvent extends WhatsAppEvent {
  from: string;
  to: string;
  isGroup: boolean;
  message: string;
}

export interface MessageHistoryRequest extends WhatsAppEvent {
  chat: string;
}

export enum IncomingEventType {
  REGISTER = "REGISTER",
  MESSAGE = "MESSAGE",
  MESSAGE_HISTORY_REQUEST = "MESSAGE_HISTORY_REQUEST",
}

export interface Chat {
  id: string;
  users: string[];
  messages: Message[];
}

export interface Message {
  from: string;
  message: string;
}

export class Chat {
  id: string;
  users: string[];
  messages: Message[] = [];

  constructor(id: string, users: string[]) {
    this.id = id;
    this.users = users;
  }

  addUser(user: string) {
    this.users.push(user);
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }
}
