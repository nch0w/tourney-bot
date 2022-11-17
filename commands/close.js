const sheet = require("../sheet");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  if (open && user.isAuthorized) {
    if (
      finalGame &&
      args.length === 1 &&
      finalGame.includes(parseInt(args[0]))
    ) {
      if (parseInt(args[0]) === gameNumber - 1) {
        finalGame = [gameNumber];
      } else {
        finalGame = [gameNumber - 1];
      }
      message.channel.send(`Guessing for Game ${args[0]} Closed.`);
    } else if (finalGame && args.length === 0) {
      message.channel.send("Guessing Closed.");
      finalGame = false;
      open = !open;
      sheet.dumpGuesses(guessDict);
    } else if (subGameIndicator) {
      message.channel.send("Guessing Closed.");
      subGameIndicator = false;
      open = !open;
      sheet.dumpGuesses(guessDict);
    } else if (args.length === 0) {
      message.channel.send("Guessing Closed.");
      open = !open;
      sheet.dumpGuesses(guessDict);
    }
  }
}

module.exports = {
  name: "close",
  aliases: [],
  execute,
};
