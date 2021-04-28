async function execute(message, args, user) {
  if (open && user.isAuthorized) {
    message.channel.send("Guessing Closed.");
    open = !open;
    if (subGameIndicator) {
      subGameIndicator = false;
    }
  }
}

module.exports = {
  name: "close",
  aliases: [],
  execute,
};
