import WebSocket from "ws";
import {
  IncomingEventType,
  MessageHistoryRequest,
  RegisterEvent,
  WhatsAppEvent,
  WhatsAppMessageEvent,
} from "./model";
import { EventService } from "./eventService";

const wss = new WebSocket.Server({ port: 8080 });

console.log("Server initialized!");

const eventService = new EventService();

wss.on("connection", (wsConnection: WebSocket) => {
  console.log("New client connected");

  wsConnection.on("message", (data: WebSocket.RawData) => {
    console.log(`Received data: ${data}`);

    handleRawData(data, wsConnection);
  });

  wsConnection.on("close", () => {
    console.log("Client disconnected");
  });
});

function handleRawData(data: WebSocket.RawData, wsConnection: WebSocket) {
  const parsedData = JSON.parse(data.toString());
  if (!parsedData.eventType) {
    return;
  }

  handleEvent(parsedData as WhatsAppEvent, wsConnection);
}

function handleEvent(event: WhatsAppEvent, wsConnection: WebSocket) {
  switch (event.eventType) {
    case IncomingEventType.MESSAGE:
      eventService.handleMessage(event as WhatsAppMessageEvent);
      break;
    case IncomingEventType.REGISTER:
      eventService.handleRegistering(event as RegisterEvent, wsConnection);

    case IncomingEventType.MESSAGE_HISTORY_REQUEST:
      eventService.handleMessageHistoryRequest(
        event as MessageHistoryRequest,
        wsConnection
      );

    default:
      break;
  }
}

export function broadcastExcludingItself(data: string, originator: WebSocket) {
  wss.clients.forEach((client) => {
    if (client !== originator) {
      console.log(`Broadcasting ${data} to ${client}`);

      client.send(data, { binary: false });
    }
  });
}
