async function execute(message, args, user) {
  if (user.isAuthorized) {
    let id = args[0];

    if (isNaN(id) || isNaN(parseFloat(id))) {
      // Assume it's a mention
      id = id.substr(2, id.length - 3);
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
