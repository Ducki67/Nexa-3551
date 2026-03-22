import { WebSocketServer } from "ws";
import crypto from "crypto";
import config from "../config";
import logger from "../logger/logger";

function parsePortFromConfig(): number {
  const mm = String(config.get("MatchMakerService.MatchMakerIp") || config.get("MatchMakerIp") || process.env.MATCHMAKER_IP || "127.0.0.1:110").trim();
  try {
    if (mm.startsWith("ws://") || mm.startsWith("wss://")) {
      const u = new URL(mm);
      return Number(u.port || (u.protocol === "wss:" ? 443 : 80));
    }
    const hostPort = mm.split("/")[0];
    const parts = hostPort.split(":");
    return Number(parts[1]) || 110;
  } catch (e) {
    return 110;
  }
}

const port = parsePortFromConfig();
const wss = new WebSocketServer({ port });

wss.on("listening", () => {
  logger.debug(`Matchmaker WS successfully started on port ${port}`);
});

wss.on("connection", (ws) => {
  const ticketId = crypto
    .createHash("md5")
    .update(`1${Date.now()}`)
    .digest("hex");
  const matchId = crypto
    .createHash("md5")
    .update(`2${Date.now()}`)
    .digest("hex");
  const sessionId = crypto
    .createHash("md5")
    .update(`3${Date.now()}`)
    .digest("hex");

  const events = [
    { delay: 200, name: "StatusUpdate", payload: { state: "Connecting" } },
    {
      delay: 1000,
      name: "StatusUpdate",
      payload: { totalPlayers: 1, connectedPlayers: 1, state: "Waiting" },
    },
    {
      delay: 2000,
      name: "StatusUpdate",
      payload: {
        ticketId,
        queuedPlayers: 0,
        estimatedWaitSec: 0,
        status: {},
        state: "Queued",
      },
    },
    {
      delay: 6000,
      name: "StatusUpdate",
      payload: { matchId, state: "SessionAssignment" },
    },
    {
      delay: 8000,
      name: "Play",
      payload: { matchId, sessionId, joinDelaySec: 1 },
    },
  ];

  events.forEach(({ delay, name, payload }) => {
    setTimeout(() => {
      if (ws.readyState === ws.OPEN) {
        try { ws.send(JSON.stringify({ name, payload })); } catch (e) {}
      }
    }, delay);
  });
});
