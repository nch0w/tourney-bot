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
        } else if (["A", "B", "C", "a", "b", "c"].includes(args[0].slice(-1))) {
          const subIndicatorList = ["a", "b", "c"];
          game =
            parseInt(args[0].slice(0, -1)) +
            (1 + subIndicatorList.indexOf(args[0].slice(-1).toLowerCase())) /
              10;
        } else {
          game = parseInt(args[0]);
        }

        const guessInfo = await sheet.getBestGuess(game);
        if (guessInfo[1] === "#N/A") {
          message.channel.send(
            errorMessage("This game is not complete or has no guesses.")
          );
        } else {
          const lineList = [
            [guessInfo[4].slice(0, 1), parseFloat(guessInfo[6])],
            [guessInfo[4].slice(1, 2), parseFloat(guessInfo[7])],
            [guessInfo[4].slice(2), parseFloat(guessInfo[8])],
          ];
          let libList = [
            guessInfo[11],
            guessInfo[12],
            guessInfo[13],
            guessInfo[14],
          ];
          libList = libList.filter((seat) => seat.length > 0);
          lineList.sort((a, b) => a[0].slice(0, 1) - b[0].slice(0, 1));
          const embed = new Discord.MessageEmbed()
            .setTitle(`Best Guess For Game ${args[0].toUpperCase()}`)
            .setDescription(
              `<@${guessInfo[1]}>\nGuess: ${guessInfo[2]}\nReal Line: ${[
                lineList[0][0],
                lineList[1][0],
                lineList[2][0],
              ].join("")}\nPoints: ${
                guessInfo[3]
              }\n\nAverage Points: ${parseFloat(guessInfo[5]).toFixed(
                1
              )}\nGuess Rate by Seat:\n**${lineList[0][0].slice(0, 1)}:** ${
                lineList[0][1]
              }/${guessInfo[9]} (${(
                (lineList[0][1] / parseFloat(guessInfo[9])) *
                100
              ).toFixed(1)}%)\n**${lineList[1][0].slice(0, 1)}:** ${
                lineList[1][1]
              }/${guessInfo[9]} (${(
                (lineList[1][1] / parseFloat(guessInfo[9])) *
                100
              ).toFixed(1)}%)\n**${lineList[2][0].slice(0, 1)}:** ${
                lineList[2][1]
              }/${guessInfo[9]} (${(
                (lineList[2][1] / parseFloat(guessInfo[9])) *
                100
              ).toFixed(1)}%)\n\nMost Guessed Liberal(s):\n**${libList.join(
                ", "
              )}:** ${guessInfo[10]}/${guessInfo[9]} (${(
                (parseFloat(guessInfo[10]) / parseFloat(guessInfo[9])) *
                100
              ).toFixed(1)}%)`
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
