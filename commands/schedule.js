const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");
const { getStartDay } = require("../constants");
const { format, utcToZonedTime } = require("date-fns-tz");
const { formatDistanceToNow } = require("date-fns");

async function scheduleEmbed(dayNumber, timeZone, footer) {
  const currentDate = new Date();
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
        const timeMessage = `${
          game.time > currentDate
            ? "Not played yet - starts"
            : "In progress - started"
        } ${formatDistanceToNow(game.time, {
          addSuffix: true,
        })}`;

        const gameHeader = `Game ${game.number} (${game.type}), ${
          utcToZonedTime(game.time, timeZone).getMinutes()
            ? format(utcToZonedTime(game.time, timeZone), "h:mma z", {
                timeZone,
              })
            : format(utcToZonedTime(game.time, timeZone), "ha z", {
                timeZone,
              })
        }`;
        if (game.type === "SILENT" || game.type === "BULLET") {
          const gameInfos = games.filter((g) => g.number === game.number);
          const played =
            gameInfos[0].played && gameInfos[1].played && gameInfos[2].played;

          return {
            name: gameHeader,
            value: played
              ? gameInfos.map(
                  (gameInfo) =>
                    `${gameInfo.subGame}: ${
                      gameInfo.fasWin ? "Fascist win" : "Liberal win"
                    }: ${gameInfo.winners.join(", ")} - [Replay](${
                      gameInfo.link
                    })`
                )
              : timeMessage,
          };
        } else {
          const gameInfo = games.find((g) => g.number === game.number);
          return {
            name: gameHeader,
            value: gameInfo.played
              ? `${
                  gameInfo.fasWin ? "Fascist win" : "Liberal win"
                }: ${gameInfo.winners.join(", ")} - [Replay](${gameInfo.link})`
              : timeMessage,
          };
        }
      })
    )
    .setFooter(footer);
}

async function execute(message, args, user) {
  const currentDate = new Date();
  let dayNumber = Math.min(
    12,
    Math.max(
      1,
      currentDate.getUTCHours() < 9 // day changes at 9AM UTC
        ? currentDate.getUTCDate() - (await getStartDay())
        : currentDate.getUTCDate() - (await getStartDay()) + 1
    )
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

  let footer = `Updated ${user.updateTime}`;

  try {
    const embed = await scheduleEmbed(dayNumber, user.timeZone, footer);
    const emb = await message.channel.send(embed);
    await emb.react("◀");
    await emb.react("▶");
    const filter = (reaction, user) => {
      return ["◀", "▶"].includes(reaction.emoji.name);
    };

    const collector = emb.createReactionCollector(filter, { time: 60000 });
    collector.on("collect", async (reaction, author) => {
      if (reaction.emoji.name === "◀") {
        dayNumber = Math.max(dayNumber - 1, 1);
      } else {
        dayNumber = Math.min(dayNumber + 1, 12);
      }
      const newEmbed = await scheduleEmbed(dayNumber, user.timeZone, footer);
      emb.edit(newEmbed);
      const userReactions = emb.reactions.cache.filter((reaction) =>
        reaction.users.cache.has(author.id)
      );
      try {
        for (const reaction of userReactions.values()) {
          await reaction.users.remove(author.id);
        }
      } catch (err) {
        // Sentry.captureException(err);
        console.error(err);
        console.error("Failed to remove reactions.");
      }
    });
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
  name: "schedule",
  aliases: ["sc"],
  description: "Schedule",
  execute,
};
