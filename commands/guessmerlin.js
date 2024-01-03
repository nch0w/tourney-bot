const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { getTournamentVCTextTwo, getGameNumber } = require("../constants");

const regex = new RegExp("^[1-7]{1}$");

async function execute(message, args, user) {
  const isdm = message.channel.type === "dm";
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const timestamp = new Date(new Date().getTime());
  const vcTextTwo = await getTournamentVCTextTwo();
  const gameNumber = await getGameNumber();
  if (
    message.channel.id !== "697225108376387724" &&
    message.channel.id !== vcTextTwo.toString() &&
    !isdm
  ) {
    //The ID of tournament-vc-text
    message.delete();
    message.channel.send(
      errorMessage(
        "Team guesses can only be made in #tournament-vc-text or DMs."
      )
    );
  } else if (
    !(await guess_information.get("openSpecial")) ||
    !["AvalonSH", "AvalonSH+", "AvalonSpecial"].includes(currentGame.mode)
  ) {
    message.channel.send(
      errorMessage(
        "Merlin guesses can only be made during in-progress Avalon SH games."
      )
    );
  } else if (args.length === 1 && regex.test(args[0])) {
    await guess_information.set(message.author.id + "_merlin", [
      timestamp,
      message.author.id,
      args[0],
      currentGame.number,
    ]);
    await guess_information.set(
      "specialGuessIDs",
      (
        await guess_information.get("specialGuessIDs")
      ).concat([message.author.id + "_merlin"])
    );
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else {
    message.channel.send(
      errorMessage("Must include a valid guess in the form 3.")
    );
  }
}

module.exports = {
  name: "guessmerlin",
  aliases: ["gm"],
  execute,
};
