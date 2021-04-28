const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  try {
    let playerNumber = 10;
    if (args.length > 0) {
      playerNumber = Math.min(parseInt(args[0]), 30);
    }
    const leaderboard = await sheet.getFantasyLeaderboard();
    noModLeaderboard = leaderboard.filter((entry) => entry.mod !== "mod");
    noModLeaderboard.sort(
      (a, b) => b.score - a.score || b.gamesWon - a.gamesWon
    );
    const ranks = rank(noModLeaderboard, "score", "gamesWon", playerNumber);
    const embed = new Discord.MessageEmbed()
      .setTitle("Fantasy League Leaderboard")
      .setDescription(
        noModLeaderboard
          .filter((entry) => entry.mod !== "mod")
          .slice(0, playerNumber)
          .map(
            (entry, i) =>
              `${ranks[i]}. <@${entry.name}>'s ${entry.team}: ${entry.score}`
          )
          .join("\n")
      )
      .setFooter(`Updated ${user.updateTime}`);
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
  description: "Guess Leaderboard",
  execute,
};
