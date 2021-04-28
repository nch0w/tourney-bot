const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

const regex = new RegExp("^[1-7hH]{3,4}$");

async function execute(message, args, user) {
  const isdm = message.channel.type === "dm";
  if (message.channel.id !== "697225108376387724" && !isdm) {
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
        "Line guesses can only be made during in-progress games before the Special Election and/or the fourth liberal policy."
      )
    );
  } else if (
    args.length === 2 &&
    regex.test(args[0]) &&
    !/([1-7hH]).*?\1/.test(args[0]) &&
    [59, 60].includes(parseInt(args[1]))
  ) {
    sheet.recordGuess(message.author.id, args[0], parseInt(args[1]));
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
    const games2 = await sheet.getGames();
    const currentGame = games2.find((g) => !g.played);
    if (subGameIndicator) {
      const subIndicatorList = ["a", "b", "c"];
      sheet.recordGuess(
        message.author.id,
        args[0],
        currentGame.number +
          (1 + subIndicatorList.indexOf(subGameIndicator)) / 10
      );
    } else {
      sheet.recordGuess(
        message.author.id,
        args[0].toLowerCase(),
        currentGame.number
      );
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
