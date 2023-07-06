const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { getTournamentVCTextTwo, getGameNumber } = require("../constants");

const regex = new RegExp("^[1-7]{7}$");

async function execute(message, args, user) {
  const isdm = message.channel.type === "dm";
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const timestamp = new Date(new Date().getTime());
  const vcTextTwo = await getTournamentVCTextTwo();
  const gameNumber = await getGameNumber();
  const specialFinalGame = await guess_information.get("specialFinalGame");
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
    currentGame.mode !== "Anonspecial"
  ) {
    message.channel.send(
      errorMessage(
        "Team guesses can only be made during in-progress Anon Special games."
      )
    );
  } else if (currentGame.number === gameNumber - 1 && args.length === 1) {
    message.channel.send(
      errorMessage(
        "Must include a valid game number, for example, s!guess 123h 59."
      )
    );
  } else if (
    args.length === 2 &&
    regex.test(args[0]) &&
    !/([1-7]).*?\1/.test(args[0]) &&
    specialFinalGame.includes(parseInt(args[1]))
  ) {
    await guess_information.set(message.author.id + "_team" + "_" + args[1], [
      timestamp,
      message.author.id,
      args[0],
      parseInt(args[1]),
    ]);
    await guess_information.set(
      "specialGuessIDs",
      (
        await guess_information.get("specialGuessIDs")
      ).concat([message.author.id + "_team" + "_" + args[1]])
    );
    //sheet.recordGuess(message.author.id, args[0], parseInt(args[1]));
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else if (
    args.length === 1 &&
    regex.test(args[0]) &&
    !/([1-7]).*?\1/.test(args[0])
  ) {
    await guess_information.set(message.author.id + "_team", [
      timestamp,
      message.author.id,
      args[0],
      currentGame.number,
    ]);
    await guess_information.set(
      "specialGuessIDs",
      (await guess_information.get("specialGuessIDs")).concat([message.author.id + "_team"])
    );
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else {
    message.channel.send(
      errorMessage("Must include a valid guess in the form 1324765.")
    );
  }
}

module.exports = {
  name: "guessteams",
  aliases: ["gt"],
  execute,
};
