const sheet = require("../sheet");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  const finalGame = await guess_information.get("finalGame");
  if ((await guess_information.get("open")) && user.isAuthorized) {
    if (
      finalGame &&
      args.length === 1 &&
      finalGame.includes(parseInt(args[0]))
    ) {
      if (parseInt(args[0]) === gameNumber - 1) {
        //finalGame = [gameNumber];
        await guess_information.set("finalGame", [gameNumber]);
      } else {
        //finalGame = [gameNumber - 1];
        await guess_information.set("finalGame", [gameNumber - 1]);
      }
      message.channel.send(`Guessing for Game ${args[0]} Closed.`);
    } else if (finalGame && args.length === 0) {
      message.channel.send("Guessing Closed.");
      //finalGame = false;
      await guess_information.set("finalGame", false);
      //open = !open;
      await guess_information.set("open", false);
      sheet.dumpGuesses(guess_information);
    } else if (subGameIndicator) {
      message.channel.send("Guessing Closed.");
      //subGameIndicator = false;
      await guess_information.set("subGameIndicator", false);
      //open = !open;
      await guess_information.set("open", false);
      sheet.dumpGuesses(guess_information);
    } else if (args.length === 0) {
      message.channel.send("Guessing Closed.");
      //open = !open;
      await guess_information.set("open", false);
      sheet.dumpGuesses(guess_information);
    }
  }
}

module.exports = {
  name: "close",
  aliases: [],
  execute,
};
