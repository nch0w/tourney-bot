require("dotenv").config();
const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const PREFIX = process.env.PREFIX;

const timezones = new Keyv("sqlite://db.sqlite", { namespace: "timezone" });

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
    let timeZone = "UTC";
    if (!dayNumber) {
      message.channel.send("Please enter a day (e.g. 1).");
      return;
    }
    if (args.length > 1) {
      timeZone = args[1].toLowerCase();
    }
    const userTimeZone = await timezones.get(message.author.id);
    console.log(userTimeZone);
    if (userTimeZone) {
      timeZone = userTimeZone;
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
    try {
      const embed = new Discord.MessageEmbed()
        .setTitle(
          `Day ${dayNumber}: ${format(
            utcToZonedTime(daySchedule.date, "UTC"),
            "eee, LLL do"
          )}`
        )
        .addFields(
          ...daySchedule.games.map((game) => {
            const gameInfo = games.find((g) => g.number === game.number);
            return {
              name: `Game ${game.number} (${game.type}), ${format(
                utcToZonedTime(game.time, timeZone),
                "ha z",
                {
                  timeZone,
                }
              )}`,
              value: gameInfo
                ? `Winner: ${gameInfo.winner} - [Replay](${gameInfo.link})`
                : "Not played yet",
            };
          })
        );
      message.channel.send(embed);
    } catch (err) {
      message.channel.send(err.toString());
    }
  } else if (command === "timezone") {
    const timeZone = args[0];
    try {
      const timeString = format(new Date(), "zzz", { timeZone });
      timezones.set(message.author.id, timeZone);
      message.channel.send(
        `<@${message.author.id}>, your timezone was set to ${timeZone} (${timeString}).`
      );
    } catch (err) {
      message.reply(
        `<@${message.author.id}>, you entered an invalid timezone: ${timeZone}.\nPlease find a list of timezones at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.`
      );
    }
  }
});

timezones.on("error", (err) => console.error("Keyv connection error:", err));

client.login(process.env.TOKEN);
