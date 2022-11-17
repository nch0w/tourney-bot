const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  if (args.length < 1) {
    message.channel.send(
      errorMessage("Must include a valid player name, like Dev or Gamethrower")
    );
  } else {
    try {
      const playerInfo = await sheet.getGlobalPlayer(
        args.join(" ").toLowerCase()
      );

      if (playerInfo[1].length === 0 && playerInfo[2].length === 0) {
        return message.channel.send(
          errorMessage(
            "😔 There was an error making your request. You may have entered an incorrect player name."
          )
        );
      }
      const tourneyNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7","T8"];
      const wins = playerInfo[2][5] || 0;
      let tourneyIndices = [];
      if (playerInfo[2].length > 0) {
        for (let i = 0; i < 8; i++) { // Has to be number of past tournies
          if (playerInfo[2][12 + i * 5]) {
            tourneyIndices.push(i);
          }
        }
      }

      const embed = new Discord.MessageEmbed()
        .setTitle(`Player Statistics for ${playerInfo[0]}`)
        .setDescription(
          playerInfo[1].length > 0
            ? playerInfo[2].length > 0
              ? `**Overall Points:** ${
                  playerInfo[2][3] + playerInfo[1][5]
                }\n**Overall Record:** ${roundToThirds(
                  playerInfo[2][2] + playerInfo[1][3]
                )}/${playerInfo[2][1] + playerInfo[1][2]} (${+(
                  ((playerInfo[2][2] + playerInfo[1][3]) /
                    (playerInfo[2][1] + playerInfo[1][2])) *
                  100
                ).toFixed(2)}%)\n**Tourney Wins:** ${wins}\n\n` +
                tourneyIndices
                  .map(
                    (entry) =>
                      `${tourneyNames[entry]}: ${
                        playerInfo[2][12 + entry * 5]
                      } - ${playerInfo[2][15 + entry * 5]} pts (${roundToThirds(
                        playerInfo[2][14 + entry * 5]
                      )}/${playerInfo[2][13 + entry * 5]})`
                  )
                  .join("\n") +
                `\nT9: ${playerInfo[1][0]} - ${
                  playerInfo[1][5]
                } pts (${roundToThirds(playerInfo[1][3])}/${playerInfo[1][2]})`
              : `**Rookie Tourney**\n\nT9: ${playerInfo[1][0]} - ${
                  playerInfo[1][5]
                } pts (${roundToThirds(playerInfo[1][3])}/${playerInfo[1][2]})`
            : `**Overall Points:** ${
                playerInfo[2][3]
              }\n**Overall Record:** ${roundToThirds(playerInfo[2][2])}/${
                playerInfo[2][1]
              } (${+((playerInfo[2][2] / playerInfo[2][1]) * 100).toFixed(
                2
              )}%)\n**Tourney Wins:** ${wins}\n\n` +
                tourneyIndices
                  .map(
                    (entry) =>
                      `${tourneyNames[entry]}: ${
                        playerInfo[2][12 + entry * 5]
                      } - ${playerInfo[2][15 + entry * 5]} pts (${roundToThirds(
                        playerInfo[2][14 + entry * 5]
                      )}/${playerInfo[2][13 + entry * 5]})`
                  )
                  .join("\n")
        )
        .setFooter(`Updated ${user.updateTime}`);
      message.channel.send(embed);
    } catch (err) {
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. You may have entered an incorrect player name."
        )
      );
    }
  }
}

module.exports = {
  name: "playerstats",
  aliases: ["ps", "stats"],
  description: "Player Stats",
  execute,
};
