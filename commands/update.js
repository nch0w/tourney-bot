const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  let author = message.author.id;

  try {
    if (
      (await authorized_data_setters.get("auth")).indexOf(author) >= 0 ||
      author === OWNER
    ) {
      if (
        (["YEAR", "MONTH", "START_DAY"].includes(args[0]) &&
          Number.isInteger(parseInt(args[1]))) ||
        (args[0].startsWith("teamEmoji") && /\p{Emoji}/u.test(args[1])) ||
        ["SHEET_URL", "FORM_URL"].includes(args[0])
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
