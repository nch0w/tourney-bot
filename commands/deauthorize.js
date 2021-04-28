async function execute(message, args, user) {
  if (user.isAuthorized) {
    let id = args[0];

    if (isNaN(id) || isNaN(parseFloat(id))) {
      // Assume it's a mention
      id = id.substr(3, id.length - 4);
    }

    await authorized_data_setters.set(
      "auth",
      (await authorized_data_setters.get("auth")).filter((x) => x !== id)
    );
    message.channel.send(`<@${id}> is now deauthorized.`);
  }
}

module.exports = {
  name: "deauthorize",
  aliases: [],
  execute,
};
