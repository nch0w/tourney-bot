const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    let id = args[0];

    if (typeof id === "undefined" || id.substr(0, 3) !== "<@&") {
      //Assume it's a mention
      return message.channel.send(errorMessage("Incorrect or no parameter."));
    }
    console.log(message.channel);
    await team_roles_channels.set(
      "teams",
      (
        await team_roles_channels.get("teams")
      ).concat([[id, message.channel.id]])
    );
    message.channel.send(
      `${id} is now in the list of team roles, associated with this channel.`
    );
  }
  console.log(team_roles_channels);
}

module.exports = {
  name: "addteam",
  aliases: [],
  execute,
};
