require("dotenv").config();
const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const { formatDistanceToNow } = require("date-fns");
const { START_DAY } = require("./constants");
const PREFIX = process.env.PREFIX;

const timezones = new Keyv("sqlite://db.sqlite", { namespace: "timezone" });

async function scheduleEmbed(dayNumber, timeZone) {
  const schedule = await sheet.getSchedule();

  const daySchedule = schedule.find(
    (day) => day.number === parseInt(dayNumber)
  );
  const games = await sheet.getGames();
  return new Discord.MessageEmbed()
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
          value: gameInfo.played
            ? `${
                gameInfo.fasWin ? "Fascist win" : "Liberal win"
              }: ${gameInfo.winners.join(", ")} - [Replay](${gameInfo.link})`
            : `Not played yet - starts in ${formatDistanceToNow(game.time)}`,
        };
      })
    );
}

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
    let dayNumber = Math.min(
      12,
      Math.max(1, new Date().getUTCDate() - START_DAY)
    );
    if (args.length > 0) {
      dayNumber = parseInt(args[0]);
    }
    let timeZone = "UTC";
    if (!dayNumber) {
      message.channel.send(
        "Please enter a day (e.g. 1) or leave blank to use the current day."
      );
      return;
    }
    // if (args.length > 1) {
    //   timeZone = args[1].toLowerCase();
    // }
    const userTimeZone = await timezones.get(message.author.id);

    if (userTimeZone) {
      timeZone = userTimeZone;
    }

    if (dayNumber < 1 || dayNumber > 12) {
      message.channel.send(`Could not find a schedule for day ${dayNumber}.`);
      return;
    }
    try {
      const embed = await scheduleEmbed(dayNumber, timeZone);
      const emb = await message.channel.send(embed);
      await emb.react("◀");
      await emb.react("▶");
      const filter = (reaction, user) => {
        return ["◀", "▶"].includes(reaction.emoji.name);
      };

      const collector = emb.createReactionCollector(filter, { time: 60000 });
      collector.on("collect", async (reaction, user) => {
        if (reaction.emoji.name === "◀") {
          dayNumber = Math.max(dayNumber - 1, 1);
        } else {
          dayNumber = Math.min(dayNumber + 1, 12);
        }
        const newEmbed = await scheduleEmbed(dayNumber, timeZone);
        emb.edit(newEmbed);
        const userReactions = emb.reactions.cache.filter((reaction) =>
          reaction.users.cache.has(user.id)
        );
        try {
          for (const reaction of userReactions.values()) {
            await reaction.users.remove(user.id);
          }
        } catch (error) {
          console.error("Failed to remove reactions.");
        }
      });
    } catch (err) {
      message.channel.send(err.toString());
    }
  } else if (command === "timezone") {
    const timeZone = args[0];
    try {
      const timeString = format(new Date(), "zzz", { timeZone });
      timezones.set(message.author.id, timeZone);
      message.reply(`your timezone was set to ${timeZone} (${timeString}).`);
    } catch (err) {
      message.reply(
        `you entered an invalid timezone: ${timeZone}.\nPlease find a list of timezones at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.`
      );
    }
  } else if (command === "mvp") {
  } else if (command === "info" || command === "help") {
    const embed = new Discord.MessageEmbed().setTitle("Commands").addFields(
      {
        name: `${PREFIX}schedule {day: optional}`,
        value:
          "Find the game schedule and replay links for today or another day",
      },
      {
        name: `${PREFIX}leaderboard`,
        value: "View the team leaderboard",
      },
      {
        name: `${PREFIX}mvp`,
        value: "View the MVP running",
      },
      {
        name: `${PREFIX}timezone {timezone}`,
        value: "Set your account's timezone",
      },
      {
        name: `${PREFIX}sheet`,
        value: "Send a link to the official tourney Google sheet",
      }
    );
    message.channel.send(embed);
  }
});

timezones.on("error", (err) => console.error("Keyv connection error:", err));

client.login(process.env.TOKEN);
