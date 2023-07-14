const subRegex = new RegExp("[abcABC123456789]{1}");
const sheet = require("../sheet");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  //const currentMode = 'AvalonSH';
  console.log(currentGame);
  if (!(await guess_information.get("open")) && user.isAuthorized) {
    message.channel.send("Guessing Opened!");
    //open = !open;
    await guess_information.clear();
    await guess_information.set("open", true);
    await guess_information.set("guessIDs", []);
    await guess_information.set("specialGuessIDs", []);
    //guessDict = {};
    if (
      ["Anonspecial", "AvalonSH", "AvalonSH+"].includes(currentGame.mode)
    ) {
      await guess_information.set("openSpecial", true);
      await guess_information.set("specialMode", currentGame.mode);
    } else {
      await guess_information.set("openSpecial", false);
      await guess_information.set("specialMode", false);
    }
    if (args.length === 1 && args[0] === "final") {
      //finalGame = [gameNumber - 1, gameNumber];
      await guess_information.set("finalGame", [gameNumber - 1, gameNumber]);
      await guess_information.set("specialFinalGame", [
        gameNumber - 1,
        gameNumber,
      ]);
      await guess_information.set("subGameIndicator", false);
    } else if (args.length === 1 && subRegex.test(args[0])) {
      //subGameIndicator = args[0].toLowerCase();
      await guess_information.set("finalGame", false);
      await guess_information.set("specialFinalGame", false);
      await guess_information.set("subGameIndicator", args[0].toLowerCase());
    } else {
      await guess_information.set("finalGame", false);
      await guess_information.set("specialFinalGame", false);
      await guess_information.set("subGameIndicator", false);
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
