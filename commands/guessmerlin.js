const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");
const { getTournamentVCTextTwo, getGameNumber } = require("../constants");

async function execute(message, args, user) {
  const isdm = message.channel.type === "dm";
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const timestamp = new Date(new Date().getTime());
  const vcTextTwo = await getTournamentVCTextTwo();
  const gameNumber = await getGameNumber();
  if (
    message.channel.id !== "855806852108255292" &&
    message.channel.id !== vcTextTwo.toString() &&
    !isdm
  ) {
    //The ID of tournament-vc-text
    message.delete();
    message.channel.send(
      errorMessage(
        "Merlin guesses can only be made in #tournament-vc-text or DMs."
      )
    );
  } else if (!open) {
    message.channel.send(
      errorMessage("Merlin guesses can only be made during in-progress games.")
    );
  } else if (currentGame.number === gameNumber - 1 && args.length === 1) {
    message.channel.send(
      errorMessage(
        "Must include a valid game number, for example, s!gm wanglebangle 53."
      )
    );
  } else if (
    args.length === 2 &&
    finalGame.includes(parseInt(args[1])) &&
    guessOptions[parseInt(args[1]) - (gameNumber - 1)]
      .map((opt) => opt.toLowerCase())
      .includes(args[0].toLowerCase())
  ) {
    guessDict[message.author.id + "_" + args[1]] = [
      timestamp,
      message.author.id,
      args[0],
      parseInt(args[1]),
    ];
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else if (
    args.length === 1 &&
    guessOptions.map((opt) => opt.toLowerCase()).includes(args[0].toLowerCase())
  ) {
    guessDict[message.author.id] = [
      timestamp,
      message.author.id,
      args[0],
      currentGame.number,
    ];
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else {
    message.channel.send(errorMessage("Must include a valid player username."));
  }
}

module.exports = {
  name: "guessmerlin",
  aliases: ["g", "gm"],
  execute,
};
