const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

const gamenums = new RegExp("^[0-9]{1,2}[ABCabc]?$|^BG[1-9]$");

async function execute(message, args, user) {
  if (args.length !== 1) {
    message.channel.send(
      errorMessage("Must include a valid game number, such as 6B or 27.")
    );
  } else {
    try {
      if (gamenums.test(args[0])) {
        let game;
        if (args[0].slice(0, 2).toUpperCase() === "BG") {
          game = parseInt(args[0].slice(-1)) / 10;
        } else if (["A", "B", "C", "D", "a", "b", "c", "d"].includes(args[0].slice(-1))) {
          const subIndicatorList = ["a", "b", "c", "d"];
          game =
            parseInt(args[0].slice(0, -1)) +
            (1 + subIndicatorList.indexOf(args[0].slice(-1).toLowerCase())) /
              10;
        } else {
          game = parseInt(args[0]);
        }

        const guessInfo = await sheet.getBestGuess(game);
        if (guessInfo.bestRow[1] === "#N/A") {
          message.channel.send(
            errorMessage("This game is not complete or has no guesses.")
          );
        } else {
          const lineList = [
            [
              guessInfo.bestRow[4].slice(0, 1),
              parseFloat(guessInfo.bestRow[6]),
            ],
            [
              guessInfo.bestRow[4].slice(1, 2),
              parseFloat(guessInfo.bestRow[7]),
            ],
            [guessInfo.bestRow[4].slice(2), parseFloat(guessInfo.bestRow[8])],
          ];
          let libList = [
            guessInfo.bestRow[11],
            guessInfo.bestRow[12],
            guessInfo.bestRow[13],
            guessInfo.bestRow[14],
          ];
          libList = libList.filter((seat) => seat.length > 0);
          lineList.sort((a, b) => a[0].slice(0, 1) - b[0].slice(0, 1));

          let specialSection = ``;

          if (guessInfo.guesserList.length > 0) {
            specialSection = `\n\nCorrect Merlin Guessers: <@${guessInfo.guesserList.join(
              ">, <@"
            )}>\nMerlin: **${guessInfo.bestRow[18]}**\n\nGuesser Accuracy: ${(
              guessInfo.bestRow[20] * 100
            ).toFixed(1)}% (${guessInfo.guesserList.length}/${
              guessInfo.bestRow[21]
            })\nMost Common False Guess: **${guessInfo.bestRow[23]}** ${(
              (guessInfo.bestRow[22] / guessInfo.bestRow[21]) *
              100
            ).toFixed(1)}% (${guessInfo.bestRow[22]}/${guessInfo.bestRow[21]})`;
          } else if (guessInfo.bestRow[24] !== "#N/A") {
            specialSection = `\n\nBest Team Order Guesser: <@${
              guessInfo.bestRow[24]
            }>\nOrder Guess: ${guessInfo.bestRow[25]}\nReal Team Order: ${
              guessInfo.bestRow[27]
            }\nPoints: ${guessInfo.bestRow[26]}\n\nAverage Points: ${parseFloat(
              guessInfo.bestRow[28]
            ).toFixed(1)}`;
          }

          const embed = new Discord.MessageEmbed()
            .setTitle(`Best Guess For Game ${args[0].toUpperCase()}`)
            .setDescription(
              `<@${guessInfo.bestRow[1]}>\nGuess: ${
                guessInfo.bestRow[2]
              }\nReal Line: ${[
                lineList[0][0],
                lineList[1][0],
                lineList[2][0],
              ].join("")}\nPoints: ${
                guessInfo.bestRow[3]
              }\n\nAverage Points: ${parseFloat(guessInfo.bestRow[5]).toFixed(
                1
              )}\nGuess Rate by Seat:\n**${lineList[0][0].slice(0, 1)}:** ${
                lineList[0][1]
              }/${guessInfo.bestRow[9]} (${(
                (lineList[0][1] / parseFloat(guessInfo.bestRow[9])) *
                100
              ).toFixed(1)}%)\n**${lineList[1][0].slice(0, 1)}:** ${
                lineList[1][1]
              }/${guessInfo.bestRow[9]} (${(
                (lineList[1][1] / parseFloat(guessInfo.bestRow[9])) *
                100
              ).toFixed(1)}%)\n**${lineList[2][0].slice(0, 1)}:** ${
                lineList[2][1]
              }/${guessInfo.bestRow[9]} (${(
                (lineList[2][1] / parseFloat(guessInfo.bestRow[9])) *
                100
              ).toFixed(1)}%)\n\nMost Guessed Liberal(s):\n**${libList.join(
                ", "
              )}:** ${guessInfo.bestRow[10]}/${guessInfo.bestRow[9]} (${(
                (parseFloat(guessInfo.bestRow[10]) /
                  parseFloat(guessInfo.bestRow[9])) *
                100
              ).toFixed(1)}%)` + specialSection
            );
          message.channel.send(embed);
        }
      }
    } catch (err) {
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. You may have entered an incorrect game number."
        )
      );
    }
  }
}

module.exports = {
  name: "bestguess",
  aliases: ["bg"],
  description: "Guess Leaderboard",
  execute,
};
