const Discord = require("discord.js");
const sheet = require("../sheet");
const _ = require("lodash");
const { getGameNumber } = require("../constants");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    if (coolDown) {
      return message.reply("you can only do that command every 5 minutes.");
    }
    var teams = await team_roles_channels.get("teams");
    const gameNumber = await getGameNumber();
    const games2 = await sheet.getGames();
    const currentGame = games2.find((g) => !g.played);
    const schedule = await sheet.getSchedule();
    const gametimes = _.range(0, 11)
      .map((day) => schedule[day].games)
      .flat();
    const currentTime = gametimes
      .filter((entry) => entry !== null)
      .find((g) => g.number === currentGame.number).time;
    const currentType = gametimes
      .filter((entry) => entry !== null)
      .find((g) => g.number === currentGame.number).type;

    for (var team of teams) {
      if (currentGame.number > gameNumber - 2) {
        message.guild.channels.cache
          .get(team[1])
          .send(
            `Hello, ${team[0]}! The final games will happen <t:${
              currentTime / 1000
            }:R>. Are your players ready?`
          );
      } else if (currentType === "Duo") {
        message.guild.channels.cache
          .get(team[1])
          .send(
            `Hello, ${team[0]}! The game will happen <t:${
              currentTime / 1000
            }:R>. Are your player and coach ready?`
          );
      } else {
        message.guild.channels.cache
          .get(team[1])
          .send(
            `Hello, ${team[0]}! The game will happen <t:${
              currentTime / 1000
            }:R>. Is your player ready?`
          );
      }
    }
    coolDown = true;
    setTimeout(() => {
      coolDown = false;
    }, 300000);
  }
}

module.exports = {
  name: "alert",
  aliases: [],
  execute,
};
