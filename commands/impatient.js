const Discord = require("discord.js");
const sheet = require("../sheet");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    await sheet.loadSheet();
    message.channel.send(`So impatient, wow`);
  }
}

module.exports = {
  name: "impatient",
  aliases: ["speed", "fast"],
  execute,
};
