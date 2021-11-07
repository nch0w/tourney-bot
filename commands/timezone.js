const { format } = require("date-fns-tz");

async function execute(message, args, user) {
  message.reply(
    "There's no need to give your timezone anymore! As long as your Discord settings are correct, the schedule automatically gives local times."
  );
  return;
  let newTimeZone = args[0];

  if (!newTimeZone) {
    message.reply(
      `you did not enter a timezone.\nPlease find your timezone at https://9f9gw.csb.app/.`
    );
    return;
  }

  // "invalid" timezone names
  if (["EST", "EDT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "America/New_York";
  } else if (["PST", "PDT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "America/Los_Angeles";
  } else if (["CST", "CDT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "America/Chicago";
  } else if (["MST", "MDT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "America/Denver";
  } else if (["HST"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Pacific/Honolulu";
  } else if (["WET", "WEST", "BST"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Europe/London";
  } else if (
    ["CET", "CEST", "MET", "MEST"].includes(newTimeZone.toUpperCase())
  ) {
    newTimeZone = "Europe/Paris";
  } else if (["EET", "EEST"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Europe/Sofia";
  } else if (["MSK", "TRT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Europe/Moscow";
  } else if (["IST"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Asia/Kolkata";
  } else if (["BJT", "SST", "SGT", "HKT"].includes(newTimeZone.toUpperCase())) {
    newTimeZone = "Asia/Shanghai";
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
    console.error(err);
    message.reply(
      `you entered an invalid timezone: ${newTimeZone}.\nPlease find your timezone at https://9f9gw.csb.app/.`
    );
  }
}

module.exports = {
  name: "timezone",
  aliases: ["tz"],
  description: "Timezone",
  execute,
};
