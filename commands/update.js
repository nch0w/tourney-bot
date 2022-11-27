const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { sheet_data } = require("../constants");

async function execute(message, args, user) {
  let author = message.author.id;

  try {
    if (user.isAuthorized) {
      if (
        ["YEAR", "MONTH", "START_DAY", "GAME_NUMBER"].includes(args[0]) &&
        Number.isInteger(parseInt(args[1]))
      ) {
        await sheet_data.set(args[0], parseInt(args[1]));
        message.channel.send(`Updated ${args[0]} to ${args[1]}!`);
      } else if (
        (args[0].startsWith("teamEmoji") && /\p{Emoji}/u.test(args[1])) ||
        ["SHEET_URL", "FORM_URL", "VC_TEXT_2_ID"].includes(args[0])
      ) {
        await sheet_data.set(args[0], args[1]);
        message.channel.send(`Updated ${args[0]} to ${args[1]}!`);
      } else {
        message.channel.send(errorMessage("Invalid update parameters."));
      }
    }
  } catch (err) {
    message.channel.send(errorMessage("No parameters entered."));
  }
}

module.exports = {
  name: "update",
  aliases: [],
  execute,
};
