const { ENABLE_DB } = require("./env");
const Keyv = require("keyv");

let sheet_data;

if (ENABLE_DB) {
  sheet_data = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "sheet_data",
  });
} else {
  sheet_data = new Keyv();
}

async function getYear() {
  const value = await sheet_data.get("YEAR");

  return value ? value : 2020;
}


async function getMonth() {
  const value = await sheet_data.get("MONTH");

  return value ? value : 11;
}

async function getTeamEmojis() {
  const values = [
    await sheet_data.get("teamEmoji1"),
    await sheet_data.get("teamEmoji2"),
    await sheet_data.get("teamEmoji3"),
    await sheet_data.get("teamEmoji4"),
    await sheet_data.get("teamEmoji5"),
    await sheet_data.get("teamEmoji6"),
    await sheet_data.get("teamEmoji7"),
  ];

  return values ? values : ["🦉", "🚫", "✌️", "🌮", "🦩", "😈", "🐬"];
}

async function getSheetURL() {
  const value = await sheet_data.get("SHEET_URL");

  return value ? value : "https://docs.google.com/spreadsheets/d/119GUu_Eeaprl5R01DZplB4Tc_vqlFeWhzaDlvg8knDI/edit#gid=76151773";
}

async function getStartDay() {
  const value = await sheet_data.get("START_DAY");

  return value ? value : 9;
}

module.exports = {
  getSheetURL: getSheetURL,
  getMonth: getMonth,
  getYear: getYear,
  getTeamEmojis: getTeamEmojis,
  getStartDay: getStartDay,
  sheet_data: sheet_data
};
