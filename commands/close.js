const sheet = require("../sheet");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  const finalGame = await guess_information.get("finalGame");
  const specialFinalGame = await guess_information.get("specialFinalGame");
  const subGameIndicator = await guess_information.get("subGameIndicator");
  if (
    ((await guess_information.get("open")) ||
      (await guess_information.get("openSpecial"))) &&
    user.isAuthorized
  ) {
    if (
      specialFinalGame &&
      args.length === 2 &&
      specialFinalGame.includes(parseInt(args[0])) &&
      args[1] === "special"
    ) {
      if (parseInt(args[0]) === gameNumber - 1) {
        await guess_information.set("specialFinalGame", [gameNumber]);
      } else {
        await guess_information.set("specialFinalGame", [gameNumber - 1]);
      }
      message.channel.send(`Special Guessing for Game ${args[0]} Closed.`);
    } else if (specialFinalGame && args.length === 1 && args[0] === "special") {
      await guess_information.set("specialFinalGame", false);
      await guess_information.set("openSpecial", false);
      sheet.dumpSpecialGuesses(guess_information);
      message.channel.send(`Special Guessing Closed.`);
    } else if (
      finalGame &&
      args.length === 1 &&
      finalGame.includes(parseInt(args[0]))
    ) {
      if (parseInt(args[0]) === gameNumber - 1) {
        await guess_information.set("finalGame", [gameNumber]);
      } else {
        await guess_information.set("finalGame", [gameNumber - 1]);
      }
      message.channel.send(`Guessing for Game ${args[0]} Closed.`);
    } else if (finalGame && args.length === 0) {
      message.channel.send("Guessing Closed.");
      await guess_information.set("finalGame", false);
      await guess_information.set("open", false);
      sheet.dumpGuesses(guess_information);
    } else if (subGameIndicator) {
      message.channel.send("Guessing Closed.");
      await guess_information.set("subGameIndicator", false);
      await guess_information.set("open", false);
      sheet.dumpGuesses(guess_information);
    } else if (args.length === 1 && args[0] == "special") {
      message.channel.send("Special Guessing Closed.");
      await guess_information.set("openSpecial", false);
      sheet.dumpSpecialGuesses(guess_information);
    } else if (args.length === 0) {
      message.channel.send("Guessing Closed.");
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
