const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  //return message.channel.send(
  //  errorMessage(
  //    "The Player Stats command is nonfunctional due to lack of a Global Sheet for Avalon."
  //  )
  //);
  if (args.length < 1) {
    message.channel.send(
      errorMessage("Must include a valid player name, like Dev or Gamethrower")
    );
  } else {
    if (
      ["secretaccount", "secret", "imverybad"].includes(
        args.join("").toLowerCase()
      )
    ) {
      const embed = new Discord.MessageEmbed()
        .setTitle("Dating Statistics for Secret Account")
        .setDescription(
          "**Overall Dates:** 0\n**Overall Record:** 0/17548 (0%)\n**Total Hoes:** 0"
        )
        .setFooter(`Updated ${user.updateTime}`);
      return message.channel.send(embed);
    }
    try {
      const playerInfo = await sheet.getGlobalPlayer(
        args.join("").toLowerCase()
      );

      if (playerInfo[1].length === 0 && playerInfo[2].length === 0) {
        return message.channel.send(
          errorMessage(
            "😔 There was an error making your request. You may have entered an incorrect player name."
          )
        );
      }
      const tourneyNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
      const wins = playerInfo[2][33] || 0; //Must be the number of the global sheet column for tourney 1sts
      let tourneyIndices = [];
      if (playerInfo[2].length > 0) {
        for (let i = 0; i < 7; i++) {
          // Has to be number of past tournies
          if (playerInfo[2][39 + i * 6]) {
            tourneyIndices.push(i);
          }
        }
      }

      const embed = new Discord.MessageEmbed()
        .setTitle(`Player Statistics for ${playerInfo[0]}`)
        .setDescription(
          playerInfo[1].length > 0
            ? playerInfo[2].length > 0
              ? //Case where player has both past and present records
                `**Overall Points:** ${
                  playerInfo[2][3] + playerInfo[1][6] //Second numbers must be the Personal Score columns of global and present sheet
                }\n**Overall Adjusted Points:** ${
                  playerInfo[2][4] + playerInfo[1][6] //Second numbers must be the Adj Personal Score columns of global and present sheet
                }\n**Overall Record:** ${playerInfo[2][2] + playerInfo[1][2]}/${
                  playerInfo[2][1] + playerInfo[1][1]
                } (${+(
                  ((playerInfo[2][2] + playerInfo[1][2]) /
                    (playerInfo[2][1] + playerInfo[1][1])) *
                  100
                ).toFixed(2)}%)\n**Tourney Wins:** ${wins}\n\n` +
                tourneyIndices
                  .map(
                    (entry) =>
                      `${tourneyNames[entry]}: ${
                        playerInfo[2][39 + entry * 6]
                      } - ${playerInfo[2][43 + entry * 6]} pts *${
                        playerInfo[2][44 + entry * 6]
                      } adj.* (${playerInfo[2][42 + entry * 6]}/${
                        playerInfo[2][41 + entry * 6]
                      })`
                  )
                  .join("\n") +
                `\nT8: ${playerInfo[1][0]} - ${
                  playerInfo[1][6]
                } pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
              : //Case where player has only present records
                `**Rookie Tourney**\n\nT8: ${playerInfo[1][0]} - ${
                  playerInfo[1][6]
                } pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
            : //Case where player has only past records
              `**Overall Points:** ${
                playerInfo[2][3]
              }\n**Overall Adjusted Points:** ${
                playerInfo[2][4]
              }\n**Overall Record:** ${playerInfo[2][2]}/${
                playerInfo[2][1]
              } (${+((playerInfo[2][2] / playerInfo[2][1]) * 100).toFixed(
                2
              )}%)\n**Tourney Wins:** ${wins}\n\n` +
                tourneyIndices
                  .map(
                    (entry) =>
                      `${tourneyNames[entry]}: ${
                        playerInfo[2][39 + entry * 6]
                      } - ${playerInfo[2][43 + entry * 6]} pts *${
                        playerInfo[2][44 + entry * 6]
                      } adj.* (${playerInfo[2][42 + entry * 6]}/${
                        playerInfo[2][41 + entry * 6]
                      })`
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
