const sheet = require("../sheet");

async function execute(message, args, user) {
  if (open && user.isAuthorized) {
    if (finalGame && args.length === 1 && finalGame.includes(parseInt(args[0]))) {
      if (parseInt(args[0]) === 59) {
        finalGame = [60];
      } else {
        finalGame = [59];
      }
      message.channel.send(`Guessing for Game ${args[0]} Closed.`);
    } else if (finalGame && args.length === 0) {
      message.channel.send("Guessing Closed.");
      finalGame = false;
      open = !open;
      sheet.dumpGuesses(guessDict)
    } else if (subGameIndicator) {
      message.channel.send("Guessing Closed.");
      subGameIndicator = false;
      open = !open;
      sheet.dumpGuesses(guessDict)
    } else if (args.length === 0) {
      message.channel.send("Guessing Closed.");
      open = !open;
      sheet.dumpGuesses(guessDict)
    }
  }
}

module.exports = {
  name: "close",
  aliases: [],
  execute,
};
