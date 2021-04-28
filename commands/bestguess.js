const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

const gamenums = new RegExp("^[0-9]{1,2}[ABCabc]?$");

async function execute(message, args, user) {
  if (args.length !== 1) {
    message.channel.send(
      errorMessage("Must include a valid game number, such as 1B or 27.")
    );
  } else {
    try {
      if (gamenums.test(args[0])) {
        if (["A", "B", "C", "a", "b", "c"].includes(args[0].slice(-1))) {
          const subIndicatorList = ["a", "b", "c"];
          const game =
            parseInt(args[0].slice(0, -1)) +
            (1 + subIndicatorList.indexOf(args[0].slice(-1).toLowerCase())) /
              10;
          const guessInfo = await sheet.getBestGuess(game);
          if (guessInfo[1] === "#N/A") {
            message.channel.send(
              errorMessage("This game is not complete or has no guesses.")
            );
          } else {
            const lineList = [
              guessInfo[4].slice(0, 1),
              guessInfo[4].slice(1, 2),
              guessInfo[4].slice(2),
            ];
            lineList.sort((a, b) => a.slice(0, 1) - b.slice(0, 1));
            const embed = new Discord.MessageEmbed()
              .setTitle(`Best Guess For Game ${args[0].toUpperCase()}`)
              .setDescription(
                `<@${guessInfo[1]}>\nGuess: ${
                  guessInfo[2]
                }\nReal Line: ${lineList.join("")}\nPoints: ${
                  guessInfo[3]
                }\nAverage Points: ${parseFloat(guessInfo[5]).toFixed(1)}`
              );
            message.channel.send(embed);
          }
        } else {
          const game = parseInt(args[0]);
          const guessInfo = await sheet.getBestGuess(game);
          if (guessInfo[1] === "#N/A") {
            message.channel.send(
              errorMessage("This game is not complete or has no guesses.")
            );
          } else {
            const lineList = [
              guessInfo[4].slice(0, 1),
              guessInfo[4].slice(1, 2),
              guessInfo[4].slice(2),
            ];
            lineList.sort((a, b) => a.slice(0, 1) - b.slice(0, 1));
            const embed = new Discord.MessageEmbed()
              .setTitle(`Best Guess For Game ${args[0].toUpperCase()}`)
              .setDescription(
                `<@${guessInfo[1]}>\nGuess: ${
                  guessInfo[2]
                }\nReal Line: ${lineList.join("")}\nPoints: ${
                  guessInfo[3]
                }\nAverage Points: ${parseFloat(guessInfo[5]).toFixed(1)}`
              );
            message.channel.send(embed);
          }
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
