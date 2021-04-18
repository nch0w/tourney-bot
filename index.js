const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const { formatDistanceToNow } = require("date-fns");
const { getStartDay, getSheetURL, sheet_data } = require("./constants");
const { getPlayers } = require("./sheet");
const { recordGuess } = require ("./sheet");
const {
  PREFIX,
  ENABLE_DB,
  DISCORD_TOKEN,
  SENTRY_DSN,
  ENABLE_SENTRY,
  OWNER
} = require("./env");
const { errorMessage, rank } = require("./message-helpers");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

if (ENABLE_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

let timezones;
let authorized_data_setters;
let open = false;

if (ENABLE_DB) {
  timezones = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "timezone",
  });
  authorized_data_setters = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "authorized_data_setter",
  });
} else {
  timezones = new Keyv();
  authorized_data_setters = new Keyv();
}

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
        if (game.type === "Silent") {
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

client.once("ready", () => {
  client.user.setActivity(`${PREFIX}info`, { type: "WATCHING" });
  console.log("Ready!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const regex = new RegExp('[1234567hH]{3,4}');

  let userTimeZone = await timezones.get(message.author.id);

  // short time zones are not supported
  if (userTimeZone) {
    if (
      userTimeZone.length <= 4 &&
      !["UTC", "GMT"].includes(userTimeZone.toUpperCase())
    ) {
      // fallback to UTC
      await timezones.set(message.author.id, "UTC");
      userTimeZone = "UTC";
      message.reply(
        `You were using an invalid timezone which has been reset to UTC. Please set it up again using \`${PREFIX}timezone\`.`
      );
    }
  }

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
      const ranks = rank(leaderboard, "score");
      const embed = new Discord.MessageEmbed()
        .setTitle("Leaderboard")
        .setDescription(
          leaderboard
            .map((entry, i) => `${ranks[i]}. ${entry.name}: ${entry.score}`)
            .join("\n")
        )
        .setFooter(`Updated ${updateTime}`);
      message.channel.send(embed);
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. Please try again in a bit."
        )
      );
    }
  } else if (["guessleaderboard", "guesslb", "glb"].includes(command)) {
    try {
      const leaderboard = await sheet.getGuessLeaderboard();
      const accuracy = (args.length === 1 && ["acc", "accuracy"].includes(args[0]))
      accuracy
        ? leaderboard.sort((a, b) => b.acc - a.acc)
        : leaderboard.sort((a, b) => b.score - a.score)
      const ranks = rank(leaderboard, "score")
      const embed = new Discord.MessageEmbed()
        .setTitle(
          accuracy
          ? "Line Guesser Accuracy Leaderboard"
          : "Line Guesser Leaderboard")
        .setDescription(
          leaderboard
            .slice(0, 10)
            .filter((entry) => entry.name !== null)
            .map((entry, i) => `${ranks[i]}. <@${entry.name}> Points: ${entry.score} Accuracy: ${entry.acc*100}%`)
            .join("\n")
        )
        .setFooter(
          accuracy
            ? `Use ${PREFIX}glb to view the best line guessers by points.\nUpdated ${updateTime}`
            : `Use ${PREFIX}glb acc to view the best line guessers by accuracy.\nUpdated ${updateTime}`)
      message.channel.send(embed);
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. Please try again in a bit."
        )
      );
    }
  } else if (["schedule", "sc"].includes(command)) {
    const currentDate = new Date();
    let dayNumber = Math.min(
      12,
      Math.max(
        1,
        currentDate.getUTCHours() < 9 // day changes at 9AM UTC
          ? currentDate.getUTCDate() - await getStartDay()
          : currentDate.getUTCDate() - await getStartDay() + 1
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
        } catch (err) {
          Sentry.captureException(err);
          console.error(err);
          console.error("Failed to remove reactions.");
        }
      });
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. Please try again in a bit."
        )
      );
    }
  } else if (command === "timezone") {
    let newTimeZone = args[0];

    if (!newTimeZone) {
      message.reply(
        `you did not enter a timezone.\nPlease find your timezone at https://9f9gw.csb.app/.`
      );
      return;
    }

    // "invalid" timezone names
    if (newTimeZone.toUpperCase() === "EST") {
      newTimeZone = "America/New_York";
    } else if (newTimeZone.toUpperCase() === "PST") {
      newTimeZone = "America/Los_Angeles";
    } else if (newTimeZone.toUpperCase() === "DALLAS") {
      newTimeZone = "Antarctica/South_Pole";
    }

    if (
      newTimeZone.length <= 4 &&
      !["UTC", "GMT"].includes(newTimeZone.toUpperCase())
    ) {
      message.reply(
        `Sorry, short timezone names are not supported at this time. Please find your timezone at https://9f9gw.csb.app/`
      );
      return;
    }

    try {
      const timeString = format(new Date(), "zzz", { timeZone: newTimeZone });
      timezones.set(message.author.id, newTimeZone);
      message.reply(`your timezone was set to ${newTimeZone} (${timeString}).`);
    } catch (err) {
      message.reply(
        `you entered an invalid timezone: ${newTimeZone}.\nPlease find your timezone at https://9f9gw.csb.app/.`
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
          "😔 There was an error making your request. Please try again in a bit."
        )
      );
      return;
    }
    if (args.length === 0) {
      players = players.filter(
        (p) => p.name && p.gamesPlayed > 0 && p.personalScore > 0
      );
      players.sort((a, b) => b.personalScore - a.personalScore);
      const ranks = rank(players, "personalScore");
      const embed = new Discord.MessageEmbed()
        .setTitle("MVP Running (Personal Score)")
        .setDescription(
          players.length > 0
            ? players
                .slice(0, ranks.length)
                .map(
                  (p, i) =>
                    `${ranks[i]}. ${p.teamName} - ${p.name} - ${p.personalScore} points `
                )
                .join("\n")
            : "This list will populate once games have been played."
        )
        .setFooter(
          `Use ${PREFIX}mvp wr to view the MVP running by winrate.\nUpdated ${updateTime}`
        );
      message.channel.send(embed);
    } else if (args.length === 1 && ["wr", "winrate"].includes(args[0])) {
      players = players.filter(
        (p) => p.name && p.gamesPlayed > 0 && p.winrate > 0
      );
      players.sort((a, b) => b.winrate - a.winrate);
      const ranks = rank(players, "winrate");
      const embed = new Discord.MessageEmbed()
        .setTitle("MVP Running (Winrate)")
        .setDescription(
          players.length > 0
            ? players
                .slice(0, ranks.length)
                .map(
                  (p, i) =>
                    `${ranks[i]}. ${p.teamName} - ${p.name} - ${(
                      p.winrate * 100
                    ).toFixed(1)}% (${p.gamesWon}/${p.gamesPlayed})`
                )
                .join("\n")
            : "This list will populate once games have been played."
        )
        .setFooter(
          `Use ${PREFIX}mvp to view the MVP running by points.\nUpdated ${updateTime}`
        );
      message.channel.send(embed);
    } else {
      message.channel.send(
        errorMessage(
          `Unknown argument: "${args[0]}". Try \`${PREFIX}mvp\` or \`${PREFIX}mvp wr\`.`
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
        name: `${PREFIX}guess {line}`,
        value: "Submit a guess for a line in a game",
      },
      {
        name: `${PREFIX}info|help`,
        value: "Show this help message",
      },
      {
        name: `${PREFIX}authorize|deauthorize`,
        value: "👀 Allows or disallows members from using admin commands.",
      },
      {
        name: `${PREFIX}update`,
        value: "👀 Updates tourney/sheet data.",
      }
    );
    message.channel.send(embed);
  } else if (command === "sheet") {
    message.channel.send(`Official Tourney Sheet: <${await getSheetURL()}>`);
  } else if (args.length > 0 && command === "authorize") {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER) { // jules :iconic:
      let id = args[0];

      if (isNaN(id) || isNaN(parseFloat(id))) {
        // Assume it's a mention
        id = id.substr(3, id.length - 4);
      }

      await authorized_data_setters.set("auth", (await authorized_data_setters.get("auth")).concat([id]));
      message.channel.send(`<@${id}> is now authorized.`);
    }
  } else if (command === "deauthorize") {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER) { // jules :iconic:
      let id = args[0];

      if (isNaN(id) || isNaN(parseFloat(id))) {
        // Assume it's a mention
        id = id.substr(3, id.length - 4);
      }

      await authorized_data_setters.set("auth", (await authorized_data_setters.get("auth")).filter(x => x !== id));
      message.channel.send(`<@${id}> is now deauthorized.`);
    }
  } else if (command === "authorized") {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER) {
      message.channel.send([...new Set(await authorized_data_setters.get("auth"))].join(', '));
    }
  } else if (command === "update") {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER) {
      await sheet_data.set(args[0], args[1]);
      message.channel.send("Done!");
    }
  } else if (command === 'guess') {
    const isdm = message.channel.type === 'dm';
    if (!open) {
      message.channel.send(
        errorMessage(
          'Line guesses can only be made during in-progress games before the Special Election and/or the fourth liberal policy.'
          )
        );
    } else if ( args.length === 2 && regex.test(args[0]) ) {
      const subIndicator = new RegExp('[abcABC]{1}')
      if (subIndicator.test(args[1])) {
        const games2 = await sheet.getGames();
        const currentGame = games2.find((g) => !g.played );
        const subIndicatorList = ['a','b','c'];
        recordGuess(message.author.id,args[0],currentGame.number + (1 + subIndicatorList.indexOf(args[1].toLowerCase()))/10);
        if (!isdm) { message.delete() }
      } else {
      recordGuess(message.author.id,args[0],parseInt(args[1]));
      if (!isdm) { message.delete() }
    }
    } else if ( args.length === 1 && regex.test(args[0]) ) {
    const games2 = await sheet.getGames();
    const currentGame = games2.find((g) => !g.played );
    recordGuess(message.author.id,args[0].toLowerCase(),currentGame.number);
    if (!isdm) { message.delete() }
  }
  } else if (command === 'open') {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if (!open && ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER)) {
      message.channel.send('Guessing Opened!');
      open = !open;
    }
  } else if (command === 'close') {
    if (!(await authorized_data_setters.get("auth"))) {
      await authorized_data_setters.set("auth", []);
    }

    let author = message.author.id;

    if (open && ((await authorized_data_setters.get("auth")).indexOf(author) >= 0 || author === OWNER)) {
      message.channel.send('Guessing Closed.');
      open = !open;
    }
  } else {
    message.channel.send(
      errorMessage(
        `Unknown command: "${command}". Please use \`${PREFIX}info\` to find a list of commands.`
      )
    );
  }
});

timezones.on("error", (err) => console.error("Keyv connection error:", err));

client.login(DISCORD_TOKEN);
