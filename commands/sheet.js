const { getSheetURL } = require("../constants");

async function execute(message, args, user) {
  message.channel.send(`Official Tourney Sheet: <${await getSheetURL()}>`);
}

module.exports = {
  name: "sheet",
  aliases: [],
  execute,
};
