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

  return value ? value : 2022;
}

async function getMonth() {
  const value = await sheet_data.get("MONTH");

  return value ? value : 5;
}

async function getTeamEmojis() {
  const values = [
    await sheet_data.get("teamEmoji1"),
    await sheet_data.get("teamEmoji2"),
    await sheet_data.get("teamEmoji3"),
    await sheet_data.get("teamEmoji4"),
    await sheet_data.get("teamEmoji5"),
    await sheet_data.get("teamEmoji6"),
  ];

  return values ? values : ["🦉", "🚫", "✌️", "🌮", "🦩", "😈"];
}

async function getSheetURL() {
  const value = await sheet_data.get("SHEET_URL");

  return value
    ? value
    : "https://docs.google.com/spreadsheets/d/1Yn2JK3QITQA3Av0SpTbNHO7eGjU2YRHjBH6dvh9JxNE/";
}

async function getFormURL() {
  const value = await sheet_data.get("FORM_URL");

  return value ? value : "https://forms.gle/2EuaR9GgFMTgasau9";
}

async function getStartDay() {
  const value = await sheet_data.get("START_DAY");

  return value ? value : 10;
}

async function getGameNumber() {
  const value = await sheet_data.get("GAME_NUMBER");

  return value ? value : 54;
}

async function getTournamentVCTextTwo() {
  const value = await sheet_data.get("VC_TEXT_2_ID");

  return value ? value : "914274308359090238";
}

module.exports = {
  getSheetURL: getSheetURL,
  getFormURL: getFormURL,
  getMonth: getMonth,
  getYear: getYear,
  getTeamEmojis: getTeamEmojis,
  getStartDay: getStartDay,
  getGameNumber: getGameNumber,
  getTournamentVCTextTwo: getTournamentVCTextTwo,
  sheet_data: sheet_data,
  GLOBAL_SHEET_URL:
    "https://docs.google.com/spreadsheets/d/1au5YS0hmneOv8kEA75VOxgcPIUya2EB19hWXl7oII-A/",
};
