const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  try {
    const accuracy = args.length > 0 && ["acc", "accuracy"].includes(args[0]);
    let playerNumber = 10;
    if (args.length > 0 && !accuracy) {
      playerNumber = Math.min(parseInt(args[0]), 30);
    } else if (args.length > 1) {
      playerNumber = Math.min(parseInt(args[1]), 30);
    }
    const leaderboard = await sheet.getGuessLeaderboard();

    accuracy
      ? leaderboard.sort((a, b) => b.acc - a.acc || b.score - a.score)
      : leaderboard.sort((a, b) => b.score - a.score || b.acc - a.acc);
    const ranks = rank(
      leaderboard,
      accuracy ? "acc" : "score",
      accuracy ? "score" : "acc",
      playerNumber
    );
    const embed = new Discord.MessageEmbed()
      .setTitle(
        accuracy
          ? "Line Guesser Accuracy Leaderboard"
          : "Line Guesser Leaderboard"
      )
      .setDescription(
        leaderboard
          .slice(0, playerNumber)
          .filter((entry) => entry.name !== null)
          .map(
            (entry, i) =>
              `${ranks[i]}\\. <@${entry.name}> Points: ${
                entry.score
              } Accuracy: ${(entry.acc * 100).toFixed(1)}%`
          )
          .join("\n")
      )
      .setFooter(
        accuracy
          ? `Use ${PREFIX}glb to view the best line guessers by points.\nUpdated ${user.updateTime}`
          : `Use ${PREFIX}glb acc to view the best line guessers by accuracy.\nUpdated ${user.updateTime}`
      );
    message.channel.send(embed);
  } catch (err) {
    // Sentry.captureException(err);
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )
    );
  }
}

module.exports = {
  name: "guessleaderboard",
  aliases: ["guesslb", "glb"],
  description: "Guess Leaderboard",
  execute,
};
