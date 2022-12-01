const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  try {
    const leaderboard = await sheet.getLeaderboard();
    leaderboard.sort((a, b) => b.score - a.score);
    const ranks = rank(leaderboard, "score");
    const embed = new Discord.MessageEmbed()
      .setTitle("Leaderboard")
      .setDescription(
        leaderboard
          .map((entry, i) => `${ranks[i]}. ${entry.name}: ${entry.score}`)
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
  name: "leaderboard",
  aliases: ["lb", "le"],
  description: "Leaderboard",
  execute,
};
