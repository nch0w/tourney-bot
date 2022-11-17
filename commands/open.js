const subRegex = new RegExp("[abcABC]{1}");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  if (!open && user.isAuthorized) {
    message.channel.send("Guessing Opened!");
    open = !open;
    guessDict = {};
    if (args.length === 1 && args[0] === "final") {
      finalGame = [gameNumber - 1, gameNumber];
    } else if (args.length === 1 && subRegex.test(args[0])) {
      subGameIndicator = args[0].toLowerCase();
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
