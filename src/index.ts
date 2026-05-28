import "./webserver.js";
import { Bot, createBot } from "mineflayer";
import { sleep } from "./utils.js";
import { readFile } from "node:fs/promises";

const BOT_PASSWORD = "1234567890";

let bot: Bot;

async function main() {
  bot = createBot({
    host: "FyodorDostoevskyy.aternos.me",
    port: 46004,
    auth: "offline",
    username: "FyodorDostoevskyy",
  });

  bot.on("login", async () => {
    console.log(`${bot.username} logged in!`);
    let chats = JSON.parse(await readFile("./botMessages.json", "utf-8")).chats;
    let noPlayerChats = JSON.parse(
      await readFile("./botMessages.json", "utf-8"),
    ).noPlayerChats;

    antiAFK(bot);
    scheduleReconnect();
    setupChatInterval(chats);
    setupNoPlayerChecker(noPlayerChats, 10);
  });

  bot.on("messagestr", (msg) => {
    if (msg.includes("/register")) {
      chat(`/register ${BOT_PASSWORD} ${BOT_PASSWORD}`);
    }

    if (msg.includes("/login")) {
      chat(`/login ${BOT_PASSWORD}`);
    }
  });

  bot.on("kicked", (reason) => {
    console.log("Kicked:", reason);

    reconnect();
  });

  bot.on("error", (err) => {
    console.log("Error:", err);

    reconnect();
  });

  bot.on("end", () => {
    console.log("Connection ended");

    reconnect();
  });
}

function scheduleReconnect() {
  // random reconnect between 20-40 minutes
  const reconnectTime =
    Math.floor(Math.random() * (40 - 20 + 1) + 20) * 60 * 1000;

  console.log(
    `Scheduled reconnect in ${Math.floor(reconnectTime / 60000)} minutes`,
  );

  setTimeout(() => {
    console.log("Reconnecting to avoid detection...");

    bot.quit("Reconnecting");

    // "end" event handles actual reconnect
  }, reconnectTime);
}

async function antiAFK(bot: Bot) {
  while (bot && bot.player) {
    await sleep(15000, 30000);

    let action = Math.floor(Math.random() * 4);

    switch (action) {
      case 0:
        bot.setControlState("jump", true);

        setTimeout(() => {
          bot.setControlState("jump", false);
        }, 500);
        break;

      case 1:
        bot.look(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI - Math.PI / 2,
          true,
        );
        break;

      case 2:
        bot.swingArm(undefined, true);
        break;

      case 3:
        bot.setControlState("sneak", true);

        setTimeout(() => {
          bot.setControlState("sneak", false);
        }, 1000);
        break;
    }
  }
}

let reconnecting = false;

function reconnect() {
  if (reconnecting) return;

  reconnecting = true;

  console.log("Reconnecting in 5 seconds...");

  setTimeout(() => {
    reconnecting = false;
    main();
  }, 5000);
}

let chatQueue: string[] = [];
let processingQueue = false;

export async function chat(msg: string) {
  chatQueue.push(msg);

  if (!processingQueue) {
    processQueue();
  }
}

async function processQueue() {
  processingQueue = true;

  while (chatQueue.length > 0) {
    const msg = chatQueue.shift()!;

    await sleep(1000, 3000);

    bot.chat(msg);
  }

  processingQueue = false;
}

function setupChatInterval(chats: string[]) {
  // sends a random message from the list every 10-20 minutes
  const chatTime = Math.floor(Math.random() * (20 - 10 + 1) + 10) * 60 * 1000;

  setInterval(() => {
    let msg = chats[Math.floor(Math.random() * chats.length)];
    chat(msg);
  }, chatTime);
}

function setupNoPlayerChecker(noPlayerChats: string[], intervalMinutes = 5) {
  setInterval(
    () => {
      if (!bot || !bot.players) return;

      const playerCount = Object.keys(bot.players).length;

      // bot is usually included in players list
      const onlyBotOnline = playerCount <= 1;

      if (onlyBotOnline) {
        const msg =
          noPlayerChats[Math.floor(Math.random() * noPlayerChats.length)];

        console.log("No players detected, sending idle chat:", msg);

        chat(msg);
      }
    },
    intervalMinutes * 60 * 1000,
  );
}

main();
