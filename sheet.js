const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./google-api-credentials.json");

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(
  "1zVZnftxBO-kwhYwjYB2v6ri4mVpP7bDrNOdJKXUDH10"
);
doc.useServiceAccountAuth(creds);
doc.loadInfo();

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells("AA2:AG15");
  const leaderboard = _.range(2, 16, 2).map((row) => ({
    name: sheet.getCellByA1(`AA${row}`).value,
    score: sheet.getCellByA1(`AG${row}`).value,
  }));
  return leaderboard;
}

module.exports = { getLeaderboard };
