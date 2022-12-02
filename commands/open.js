const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  if (!open && user.isAuthorized) {
    if (args.length === 6 || (args.length === 13 && args[0] === "final")) {
      message.channel.send("Guessing Opened!");
      open = !open;
      guessDict = {};
      if (args[0] === "final") {
        finalGame = [gameNumber - 1, gameNumber];
        guessOptions = [args.slice(1,7),args.slice(7,13)];
      } else {
        guessOptions = args;
      }
    } else {
      return message.channel.send(errorMessage("Incorrect or no parameters. Remember to list all player usernames separated by spaces."));
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
