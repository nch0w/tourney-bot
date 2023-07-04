const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  try {
    let id = message.author.id;
    if (args.length > 0) {
      id = args[0];
    }
    if (args.length > 0 && (isNaN(args[0]) || isNaN(parseFloat(args[0])))) {
      // Assume it's a mention
      id = id.substr(2, id.length - 3);
    }
    const guessRecord = await sheet.getPersonalStats(id);
    const embed = new Discord.MessageEmbed()
      .setTitle("Personal Guess Record")
      .setDescription(
        guessRecord.map(
          (entry, i) => `**${entry.game}.** ${entry.merlin} (${entry.correct})`
        )
      )
      .addField("Guesser:", `<@${id}>`)
      .setFooter(`Updated ${user.updateTime}`);
    message.channel.send(embed);
  } catch (err) {
    // Sentry.captureException(err);
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )
    );
  }
}

module.exports = {
  name: "personalrecord",
  aliases: ["pr"],
  description: "Personal Guess Record",
  execute,
};
