const Discord = require("discord.js");

const errorMessage = (message) => {
  return new Discord.MessageEmbed().setDescription(message).setColor("#ff0000");
};

module.exports = { errorMessage };
