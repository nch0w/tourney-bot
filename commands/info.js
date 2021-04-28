const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  const embed = new Discord.MessageEmbed().setTitle("Commands").addFields(
    {
      name: `${PREFIX}schedule|sc {day: optional}`,
      value: "Find the game schedule and replay links for today or another day",
    },
    {
      name: `${PREFIX}leaderboard|lb`,
      value: "View the team leaderboard",
    },
    {
      name: `${PREFIX}guessleaderboard|glb {length}`,
      value: "View the line guessers leaderboard",
    },
    {
      name: `${PREFIX}fantasyleaderboard|flb {length}`,
      value: "View the Fantasy League leaderboard",
    },
    {
      name: `${PREFIX}bestguess|bg {game}`,
      value: "View the best guess made for a specific game",
    },
    {
      name: `${PREFIX}mvp`,
      value: "View the MVP running",
    },
    {
      name: `${PREFIX}timezone {timezone}`,
      value: "Set your account's timezone",
    },
    {
      name: `${PREFIX}sheet`,
      value: "Send a link to the official tourney Google sheet",
    },
    {
      name: `${PREFIX}global`,
      value: "Send a link to the official global tourney Google sheet",
    },
    {
      name: `${PREFIX}submit`,
      value: "Send a link to the Quotes/Gag Awards/Reports form",
    },
    {
      name: `${PREFIX}guess {line}`,
      value: "Submit a guess for a line in a game",
    },
    {
      name: `${PREFIX}info|help`,
      value: "Show this help message",
    }
  );
  message.channel.send(embed);
}

module.exports = {
  name: "info",
  aliases: ["help"],
  description: "Guess Leaderboard",
  execute,
};
