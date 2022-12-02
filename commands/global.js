const { GLOBAL_SHEET_URL } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  message.channel.send(
    errorMessage("There is no Global Sheet for Avalon... Yet.")
  );
  //message.channel.send(`Official Global Tourney Sheet: <${GLOBAL_SHEET_URL}>`);
}

module.exports = {
  name: "global",
  aliases: [],
  execute,
};
