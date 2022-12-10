const Discord = require("discord.js");
const sheet = require("../sheet");
const _ = require("lodash");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    //if (args[0] == null) {
    //  return message.channel.send(errorMessage("No link given."));
    //}
    //const link = args[0];

    var channels = await team_roles_channels.get("teams");
    channels = channels.map((team) => team[1]);
    channels = channels.concat(["727261182448107550", "855806852108255292"]); //channel ids for tournament-chat and tournament-vc-text
    const games2 = await sheet.getGames();
    const currentGame = games2.find((g) => !g.played);
    const schedule = await sheet.getSchedule();
    const gametypes = _.range(0, 9)
      .map((day) => schedule[day].games)
      .flat();
    const currentType = gametypes
      .filter((entry) => entry !== null)
      .find((g) => g.number === currentGame.number).type;
    for (var channel of channels) {
      if (currentType === "VC") {
        message.guild.channels.cache
          .get(channel)
          .send(
            `The tournament game is about to begin. :warning: :no_entry: Remember to be respectful to all players and not to make comments about the game here or where players can see it, thanks! :warning: :no_entry: If you want to spectate and listen in on the game join the Tournament VC game voice channel. Note, that you will be muted in that VC but you will be able to chat in #tournament-vc-text per usual. We will be streaming the game in VC. Enjoy!`
          );
      } else {
        message.guild.channels.cache
          .get(channel)
          .send(
            `The tournament game is about to begin. :warning: :no_entry: Remember not to make any comment about the game here or where players can see it, thanks! :warning: :no_entry: If you want to spectate and chat please join the Tournament VC and limit all chat to #tournament-vc-text. After the conclusion of the game, please be respectful to all of the players. We will be streaming the game in VC. Enjoy!`
          );
      }
    }
  }
}

module.exports = {
  name: "gamepasta",
  aliases: ["pasta"],
  execute,
};
