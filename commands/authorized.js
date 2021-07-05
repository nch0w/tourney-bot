async function execute(message, args, user) {
  if (user.isAuthorized) {
    message.channel.send(
      `<@${[...new Set(await authorized_data_setters.get("auth"))].join(
        ">, <@"
      )}>`
    );
  }
}

module.exports = {
  name: "authorized",
  aliases: [],
  execute,
};
