const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    sheet.dumpGuesses(guess_information);
    sheet.dumpSpecialGuesses(guess_information);
    message.channel.send("Guesses Re-Dumped.");
  }
}

module.exports = {
  name: "redump",
  aliases: ["dump", "rd"],
  execute,
};
