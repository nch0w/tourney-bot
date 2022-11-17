const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  try {
    const ppg = args.length > 0 && ["pointspergame", "ppg"].includes(args[0]);
    let playerNumber = 10;
    if (args.length > 0 && !ppg) {
      playerNumber = Math.min(parseInt(args[0]), 30);
    } else if (args.length > 1) {
      playerNumber = Math.min(parseInt(args[1]), 30);
    }
    const leaderboard = await sheet.getFantasyLeaderboard();
    noModLeaderboard = leaderboard.filter((entry) => entry.mod !== "mod");
    ppg
      ? noModLeaderboard.sort((a, b) => b.pointsPerGame - a.pointsPerGame || b.score - a.score)
      : noModLeaderboard.sort((a, b) => b.score - a.score || b.pointsPerGame - a.pointsPerGame);
    const ranks = rank(
      noModLeaderboard,
      ppg ? "pointsPerGame" : "score",
      ppg ? "score" : "pointsPerGame",
      playerNumber
    );
    const embed = new Discord.MessageEmbed()
      .setTitle(
        ppg
          ? "Fantasy League Points Per Game Leaderboard"
          : "Fantasy League Leaderboard"
      )
      .setDescription(
        noModLeaderboard
          .slice(0, playerNumber)
          .map(
            ppg
              ? (entry, i) => `${ranks[i]}. <@${entry.name}>'s ${entry.team}: ${entry.pointsPerGame}`
              : (entry, i) => `${ranks[i]}. <@${entry.name}>'s ${entry.team}: ${entry.score}`
          )
          .join("\n")
      )
      .setFooter(
        ppg
          ? `Use ${PREFIX}flb to view the best Fantasy Teams by points.\nUpdated ${user.updateTime}`
          : `Use ${PREFIX}flb ppg to view the best Fantasy Teams by points per game.\nUpdated ${user.updateTime}`
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
  name: "fantasyleaderboard",
  aliases: ["fantasylb", "flb"],
  description: "Fantasy Leaderboard",
  execute,
};
