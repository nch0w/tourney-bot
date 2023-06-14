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

global.authorized_data_setters;
global.team_roles_channels;
//global.open = false;
//global.guessOptions = false;
//global.finalGame = false;
//global.guessDict = false;
global.guess_information;
global.coolDown = false;

if (ENABLE_DB) {
  authorized_data_setters = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "authorized_data_setter",
  });
  team_roles_channels = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "team_roles_channels",
  });
  guess_information = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "guess_information",
  });
} else {
  authorized_data_setters = new Keyv();
  team_roles_channels = new Keyv();
  guess_information = new Keyv();
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
  // initialize auth if not done already
  if (!(await authorized_data_setters.get("auth"))) {
    await authorized_data_setters.set("auth", []);
  }

  if (!(await team_roles_channels.get("teams"))) {
    await team_roles_channels.set("teams", []);
  }

  if (!(await guess_information.get("open"))) {
    await team_roles_channels.set("open", false);
  }
  if (!(await guess_information.get("guessOptions"))) {
    await team_roles_channels.set("guessOptions", false);
  }
  if (!(await guess_information.get("finalGame"))) {
    await team_roles_channels.set("finalGame", false);
  }

  const isAuthorized =
    (await authorized_data_setters.get("auth")).indexOf(message.author.id) >=
      0 || message.author.id === OWNER;

  //if (message.channel.id === "599756425241296897" && !isAuthorized) return; //event-general-chat id

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const updateTime = format(
    utcToZonedTime(sheet.getUpdateTime(), "America/Los_Angeles"),
    "h:mm:ss a zzz",
    { timeZone: "America/Los_Angeles" }
  );

  const user = {
    updateTime,
    isAuthorized,
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

client.login(DISCORD_TOKEN);
