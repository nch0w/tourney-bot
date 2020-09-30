require("dotenv").config();
const Discord = require("discord.js");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format } = require("date-fns");
const PREFIX = process.env.PREFIX;

client.once("ready", () => {
  console.log("Ready!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "leaderboard") {
    const leaderboard = await sheet.getLeaderboard();
    leaderboard.sort((a, b) => b.score - a.score);
    message.channel.send(
      leaderboard.map((entry) => `${entry.name}: ${entry.score}`).join("\n")
    );
  } else if (command === "schedule") {
    const dayNumber = args[0];
    if (!dayNumber) {
      message.channel.send("Please enter a day (e.g. 1).");
      return;
    }
    const schedule = await sheet.getSchedule();
    const games = await sheet.getGames();

    const daySchedule = schedule.find(
      (day) => day.number === parseInt(dayNumber)
    );
    if (!daySchedule) {
      message.channel.send("Could not find a schedule for this day.");
      return;
    }
    const embed = new Discord.MessageEmbed()
      .setTitle(`Day ${dayNumber}: ${format(daySchedule.date, "eee, LLL do")}`)
      .addFields(
        ...daySchedule.games.map((game) => {
          const gameInfo = games.find((g) => g.number === game.number);
          return {
            name: `Game ${game.number} (${game.type}), ${game.time}`,
            value: gameInfo
              ? `Winner: ${gameInfo.winner} [Replay](${gameInfo.link})`
              : "Not played yet",
          };
        })
      );
    message.channel.send(embed);
  }
});

client.login(process.env.TOKEN);
