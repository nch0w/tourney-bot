const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./google-api-credentials.json");
const { parse, format } = require("date-fns");
const { zonedTimeToUtc } = require("date-fns-tz");

// for now, assume the tourney games are all in the same year and month
YEAR = 2020;
MONTH = 10; // november

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(
  "1zVZnftxBO-kwhYwjYB2v6ri4mVpP7bDrNOdJKXUDH10"
);
doc.useServiceAccountAuth(creds);

async function loadSheet() {
  await doc.loadInfo();
  await doc.sheetsByIndex[0].loadCells("AA2:AG15");
  await doc.sheetsByIndex[1].loadCells("A1:S23");
  await doc.sheetsByIndex[2].loadCells("A1:R57");
}

setTimeout(loadSheet, 0);
setInterval(loadSheet, 60000);

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[0];
  // await sheet.loadCells("AA2:AG15");
  const leaderboard = _.range(2, 16, 2).map((row) => ({
    name: sheet.getCellByA1(`AA${row}`).value,
    score: sheet.getCellByA1(`AG${row}`).value,
  }));
  return leaderboard;
}

async function getSchedule() {
  const sheet = doc.sheetsByIndex[1];
  // await sheet.loadCells("A1:S23");
  const dayNameCells = [
    ..._.range(1, 13, 2).map((num) => [2, num]),
    ..._.range(1, 13, 2).map((num) => [13, num]),
  ];
  const dayNames = dayNameCells.map(
    (name) => sheet.getCell(name[0], name[1]).value
  );

  const schedule = dayNames.map((name, idx) => {
    const day = parseInt(name.match(/\d+/)[0]);
    const date = new Date(Date.UTC(YEAR, MONTH, day));
    return {
      number: idx + 1,
      date,
      games: _.range(0, 4).map((row) => {
        const cellTime = sheet.getCell(
          dayNameCells[idx][0] + 1 + 2 * row,
          dayNameCells[idx][1] + 1
        ).value;
        const cellHours = parseInt(cellTime.match(/\d+/)[0]);
        const am = cellTime.match(/AM/) != null;
        return {
          type: sheet.getCell(
            dayNameCells[idx][0] + 1 + 2 * row,
            dayNameCells[idx][1]
          ).value,
          number: parseInt(
            sheet
              .getCell(dayNameCells[idx][0] + 2 + 2 * row, dayNameCells[idx][1])
              .value.match(/\d+/)[0]
          ),
          time: am
            ? new Date(Date.UTC(YEAR, MONTH, day + 1, cellHours))
            : new Date(Date.UTC(YEAR, MONTH, day, cellHours + 12)),
        };
      }),
    };
  });
  return schedule;
}

async function getGames() {
  const sheet = doc.sheetsByIndex[2];
  // await sheet.loadCells("A1:R57");
  return _.range(1, 49).map((number) => ({
    number,
    winner: sheet.getCell(number + 2, 11).value,
    link: sheet.getCell(number + 2, 12).value,
  }));
}

module.exports = { getLeaderboard, getSchedule, getGames };
