const subRegex = new RegExp("[abcABC]{1}");

async function execute(message, args, user) {
  if (!open && user.isAuthorized) {
    message.channel.send("Guessing Opened!");
    open = !open;
    if (args.length === 1 && args[0] === "final") {
      finalGame = [59,60];
    } else if (args.length === 1 && subRegex.test(args[0])) {
      subGameIndicator = args[0].toLowerCase();
    }
  }
}

module.exports = {
  name: "open",
  aliases: [],
  execute,
};
