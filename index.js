const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const { formatDistanceToNow } = require("date-fns");
const { START_DAY } = require("./constants");
const { getPlayers } = require("./sheet");
const { PREFIX, ENABLE_DB, DISCORD_TOKEN, SENTRY_DSN } = require("./env");
const { errorMessage } = require("./message-helpers");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
});

let timezones;

if (ENABLE_DB) {
  timezones = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "timezone",
  });
} else {
  timezones = new Keyv();
}

async function scheduleEmbed(dayNumber, timeZone, footer) {
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
    )
    .setFooter(footer);
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const userTimeZone = await timezones.get(message.author.id);
  const timeZone = userTimeZone || "UTC";
  const updateTime = format(
    utcToZonedTime(sheet.getUpdateTime(), timeZone),
    "h:mm:ss a zzz",
    { timeZone }
  );

  if (["leaderboard", "lb", "le"].includes(command)) {
    try {
      const leaderboard = await sheet.getLeaderboard();
      leaderboard.sort((a, b) => b.score - a.score);

      const embed = new Discord.MessageEmbed()
        .setTitle("Leaderboard")
        .setDescription(
          leaderboard
            .map((entry, i) => `${i + 1}. ${entry.name}: ${entry.score}`)
            .join("\n")
        )
        .setFooter(`Updated ${updateTime}`);
      message.channel.send(embed);
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      message.channel.send(
        errorMessage(
          "There was an error making your request. 😔 Please try again in a bit."
        )
      );
    }
  } else if (["schedule", "sc"].includes(command)) {
    let dayNumber = Math.min(
      12,
      Math.max(1, new Date().getUTCDate() - START_DAY)
    );
    if (args.length > 0) {
      dayNumber = parseInt(args[0]);
    }

    if (!dayNumber) {
      message.channel.send(
        errorMessage(
          "Please enter a day (e.g. 1) or leave blank to use the current day."
        )
      );
      return;
    }
    // if (args.length > 1) {
    //   timeZone = args[1].toLowerCase();
    // }

    if (dayNumber < 1 || dayNumber > 12) {
      message.channel.send(
        errorMessage(`Could not find a schedule for day ${dayNumber}.`)
      );
      return;
    }

    let footer = `Updated ${updateTime}`;

    try {
      const embed = await scheduleEmbed(dayNumber, timeZone, footer);
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
        const newEmbed = await scheduleEmbed(dayNumber, timeZone, footer);
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
      Sentry.captureException(err);
      console.error(err);
      message.channel.send(
        errorMessage(
          "There was an error making your request. 😔 Please try again in a bit."
        )
      );
    }
  } else if (command === "timezone") {
    const newTimeZone = args[0];
    if (!newTimeZone) {
      message.reply(
        `you did not enter a timezone.\nPlease find a list of timezones at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.`
      );
      return;
    }
    try {
      const timeString = format(new Date(), "zzz", { timeZone: newTimeZone });
      timezones.set(message.author.id, newTimeZone);
      message.reply(`your timezone was set to ${newTimeZone} (${timeString}).`);
    } catch (err) {
      message.reply(
        `you entered an invalid timezone: ${newTimeZone}.\nPlease find a list of timezones at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.`
      );
    }
  } else if (command === "mvp") {
    let players;
    try {
      players = await getPlayers();
    } catch (err) {
      console.error(err);
      message.channel.send(
        errorMessage(
          "There was an error making your request. 😔 Please try again in a bit."
        )
      );
      return;
    }
    if (args.length === 0) {
      players = players.filter((p) => p.name && p.personalScore >= 0);
      players.sort((a, b) => b.personalScore - a.personalScore);
      const embed = new Discord.MessageEmbed()
        .setTitle("MVP Running (Personal Score)")
        .setDescription(
          players
            .slice(0, 10)
            .map(
              (p, i) =>
                `${i + 1}. ${p.teamName} - ${p.name} - ${
                  p.personalScore
                } points `
            )
            .join("\n")
        )
        .setFooter(
          `Use ${PREFIX}mvp wr to view the MVP running by winrate.\nUpdated ${updateTime}`
        );
      message.channel.send(embed);
    } else if (args.length === 1 && ["wr", "winrate"].includes(args[0])) {
      players = players.filter((p) => p.name);
      players.sort((a, b) => b.winrate - a.winrate);
      const embed = new Discord.MessageEmbed()
        .setTitle("MVP Running (Winrate)")
        .setDescription(
          players
            .slice(0, 10)
            .map(
              (p, i) =>
                `${i + 1}. ${p.teamName} - ${p.name} - ${p.winrate} (${
                  p.gamesWon
                }/${p.gamesPlayed} games)`
            )
            .join("\n")
        )
        .setFooter(
          `Use ${PREFIX}mvp to view the MVP running by points.\nUpdated ${updateTime}`
        );
      message.channel.send(embed);
    } else {
      message.channel.send(
        errorMessage(
          `Unkown argument: "${args[0]}". Try \`${PREFIX}mvp\` or \`${PREFIX}mvp wr\`.`
        )
      );
    }
  } else if (["info", "help"].includes(command)) {
    const embed = new Discord.MessageEmbed().setTitle("Commands").addFields(
      {
        name: `${PREFIX}schedule|sc {day: optional}`,
        value:
          "Find the game schedule and replay links for today or another day",
      },
      {
        name: `${PREFIX}leaderboard|lb`,
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
      },
      {
        name: `${PREFIX}info|help`,
        value: "Show this help message",
      }
    );
    message.channel.send(embed);
  } else {
    message.channel.send(
      errorMessage(
        `Unkown command: "${command}". Please use \`${PREFIX}info\` to find a list of commands.`
      )
    );
  }
});

timezones.on("error", (err) => console.error("Keyv connection error:", err));

client.login(DISCORD_TOKEN);
