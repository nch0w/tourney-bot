const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    await team_roles_channels.set(
      "teams",
      (
        await team_roles_channels.clear("teams")
      )
    );
    message.channel.send(
      "All team roles and channels have now been cleared from the list."
    );
  }
  console.log(team_roles_channels);
}

module.exports = {
  name: "clearteams",
  aliases: [],
  execute,
};
