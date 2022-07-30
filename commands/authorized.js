const Discord = require("discord.js");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    const embed = new Discord.MessageEmbed()
      .setTitle("Authorized Tourney Bot Users:")
      .setDescription(
        `<@${[...new Set(await authorized_data_setters.get("auth"))].join(
          ">, <@"
        )}>`
      )
      .setFooter(`Updated ${user.updateTime}`);
    message.channel.send(embed);
  }
}

module.exports = {
  name: "authorized",
  aliases: [],
  execute,
};
