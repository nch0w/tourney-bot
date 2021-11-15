const Discord = require("discord.js");
const sheet = require("../sheet");
const { formatDistanceToNow } = require("date-fns");
const _ = require("lodash");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    var teams = await team_roles_channels.get("teams");
    const games2 = await sheet.getGames();
    const currentGame = games2.find((g) => !g.played);
    const schedule = await sheet.getSchedule();
    const gametimes = _.range(0, 10)
      .map((day) => schedule[day].games)
      .flat();
    const currentTime = gametimes
      .filter((entry) => entry !== null)
      .find((g) => g.number === currentGame.number).time;
    console.log(gametimes);
    for (var team of teams) {
      if (currentGame.number > 46) {
        message.guild.channels.cache
          .get(team[1])
          .send(
            `Hello, ${
              team[0]
            }! The final games will happen ${formatDistanceToNow(currentTime, {
              addSuffix: true,
            })}. Are your players ready?`
          );
      } else {
        message.guild.channels.cache
          .get(team[1])
          .send(
            `Hello, ${team[0]}! The game will happen ${formatDistanceToNow(
              currentTime,
              { addSuffix: true }
            )}. Is your player ready?`
          );
      }
    }
  }
}

module.exports = {
  name: "alert",
  aliases: [],
  execute,
};
