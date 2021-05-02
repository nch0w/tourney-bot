const fs = require("fs");
const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const {
  PREFIX,
  ENABLE_DB,
  DISCORD_TOKEN,
  SENTRY_DSN,
  ENABLE_SENTRY,
  OWNER,
} = require("./env");
const { errorMessage } = require("./message-helpers");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

if (ENABLE_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

global.timezones;
global.authorized_data_setters;
global.open = false;
global.subGameIndicator = false;
global.finalGame = false;

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

client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  client.user.setActivity(`${PREFIX}info`, { type: "WATCHING" });
  console.log("Ready!");
});

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

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

  // initialize auth if not done already
  if (!(await authorized_data_setters.get("auth"))) {
    await authorized_data_setters.set("auth", []);
  }

  const user = {
    timeZone,
    updateTime,
    isAuthorized:
      (await authorized_data_setters.get("auth")).indexOf(message.author.id) >=
        0 || message.author.id === OWNER,
    isOwner: message.author.id === OWNER,
  };

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (command) {
    try {
      await command.execute(message, args, user);
    } catch (error) {
      console.error(error);
      message.channel.send(
        errorMessage(`There was an error trying to execute \`${commandName}\`.`)
      );
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
