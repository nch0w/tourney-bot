const subRegex = new RegExp("[abcABC]{1}");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  if (!(await guess_information.get("open")) && user.isAuthorized) {
    message.channel.send("Guessing Opened!");
    //open = !open;
    await guess_information.clear();
    await guess_information.set("open", true);
    await guess_information.set("guessIDs", []);
    //guessDict = {};
    if (args.length === 1 && args[0] === "final") {
      //finalGame = [gameNumber - 1, gameNumber];
      await guess_information.set("finalGame", [gameNumber - 1, gameNumber]);
      await guess_information.set("subGameIndicator", false);
    } else if (args.length === 1 && subRegex.test(args[0])) {
      //subGameIndicator = args[0].toLowerCase();
      await guess_information.set("finalGame", false);
      await guess_information.set("subGameIndicator", args[0].toLowerCase());
    } else {
      await guess_information.set("finalGame", false);
      await guess_information.set("subGameIndicator", false);
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
