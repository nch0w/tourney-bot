require("dotenv").config();
const Discord = require("discord.js");
const sheet = require("./sheet");
const client = new Discord.Client();

const PREFIX = process.env.PREFIX;

client.once("ready", () => {
  console.log("Ready!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "leaderboard") {
    const leaderboard = await sheet.getLeaderboard();
    leaderboard.sort((a, b) => b.score - a.score);
    message.channel.send(
      leaderboard.map((entry) => `${entry.name}: ${entry.score}`).join("\n")
    );
  }
});

client.login(process.env.TOKEN);
