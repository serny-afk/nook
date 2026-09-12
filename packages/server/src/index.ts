import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@nook/shared";
import { WorldRoom } from "./rooms/WorldRoom.js";

const port = Number(process.env.PORT) || 2567;

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

gameServer.define(ROOM_NAME, WorldRoom);

await gameServer.listen(port);
console.log(`[nook] world server listening on ws://localhost:${port}`);
