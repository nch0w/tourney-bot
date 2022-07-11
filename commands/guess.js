const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

const regex = new RegExp("^[1-7hH]{3,4}$");

async function execute(message, args, user) {
  const isdm = message.channel.type === "dm";
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const timestamp = new Date(new Date().getTime());
  if (
    message.channel.id !== "697225108376387724" &&
    message.channel.id !== "914274308359090238" &&
    !isdm
  ) {
    //The ID of tournament-vc-text
    message.delete();
    message.channel.send(
      errorMessage(
        "Line guesses can only be made in #tournament-vc-text or DMs."
      )
    );
  } else if (!open) {
    message.channel.send(
      errorMessage(
        "Line guesses can only be made during in-progress games before the Special Election."
      )
    );
  } else if (currentGame === 59 && args.length === 1) {
    message.channel.send(
      errorMessage(
        "Must include a valid game number, for example, s!guess 123h 59."
      )
    );
  } else if (
    args.length === 2 &&
    regex.test(args[0]) &&
    !/([1-7hH]).*?\1/.test(args[0]) &&
    finalGame.includes(parseInt(args[1]))
  ) {
    guessDict[message.author.id + "_" + args[1]] = [
      timestamp,
      message.author.id,
      args[0],
      parseInt(args[1]),
    ];
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
    !/([1-7hH]).*?\1/.test(args[0])
  ) {
    if (subGameIndicator) {
      const subIndicatorList = ["a", "b", "c"];
      guessDict[message.author.id] = [
        timestamp,
        message.author.id,
        args[0],
        currentGame.number +
          (1 + subIndicatorList.indexOf(subGameIndicator)) / 10,
      ];
      //sheet.recordGuess(
      //  message.author.id,
      //  args[0],
      //  currentGame.number +
      //    (1 + subIndicatorList.indexOf(subGameIndicator)) / 10
      //);
    } else {
      guessDict[message.author.id] = [
        timestamp,
        message.author.id,
        args[0],
        currentGame.number,
      ];
      //sheet.recordGuess(
      //  message.author.id,
      //  args[0].toLowerCase(),
      //  currentGame.number
      //);
    }
    if (!isdm) {
      message.delete();
      message.channel.send(`<@${message.author.id}>'s guess received!`);
    } else {
      message.channel.send("Guess received!");
    }
  } else {
    message.channel.send(
      errorMessage(
        "Must include a valid guess in the form 567 or 123h, where h goes after Hitler's seat."
      )
    );
  }
}

module.exports = {
  name: "guess",
  aliases: ["g"],
  execute,
};
