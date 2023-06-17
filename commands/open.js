const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  const gameNumber = await getGameNumber();
  if (!(await guess_information.get("open")) && user.isAuthorized) {
    if (args.length === 6 || (args.length === 13 && args[0] === "final")) {
      message.channel.send("Guessing Opened!");
      //open = !open;
      await guess_information.clear();
      await guess_information.set("open", true);
      await guess_information.set("guessIDs", []);
      //guessDict = {};
      if (args[0] === "final") {
        await guess_information.set("finalGame", [gameNumber - 1, gameNumber]);
        //finalGame = [gameNumber - 1, gameNumber];
        await guess_information.set("guessOptions", [
          args.slice(1, 7),
          args.slice(7, 13),
        ]);
        //guessOptions = [args.slice(1,7),args.slice(7,13)];
      } else {
        //guessOptions = args;
        await guess_information.set("finalGame", false);
        await guess_information.set("guessOptions", args);
      }
    } else {
      return message.channel.send(
        errorMessage(
          "Incorrect or no parameters. Remember to list all player usernames separated by spaces."
        )
      );
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
