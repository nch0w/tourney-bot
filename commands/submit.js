const { getFormURL } = require("../constants");

async function execute(message, args, user) {
  message.channel.send(
    `Quotes/Gag Awards/Reports Form: <${await getFormURL()}>`
  );
}

module.exports = {
  name: "submit",
  aliases: [],
  execute,
};
