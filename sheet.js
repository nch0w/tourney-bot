const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
var Mutex = require("async-mutex").Mutex;
const {
  SHEET_PRIVATE_ID,
  MOD_SHEET_PRIVATE_ID,
  GOOGLE_API_CREDENTIALS,
} = require("./env");
const { getYear, getMonth, getTeamEmojis } = require("./constants");

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(SHEET_PRIVATE_ID);
const moddoc = new GoogleSpreadsheet(MOD_SHEET_PRIVATE_ID);
doc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
moddoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);

let updateTime = new Date(new Date().getTime());
const lineGuessMutex = new Mutex();

async function loadSheet() {
  updateTime = new Date(new Date().getTime());
  await doc.loadInfo();
  await doc.sheetsByIndex[0].loadCells("AA2:AL15");
  await doc.sheetsByIndex[1].loadCells("A1:S28");
  await doc.sheetsByIndex[2].loadCells("A1:CA100");
  await doc.sheetsByIndex[4].loadCells("A1:S113");
  await doc.sheetsByIndex[5].loadCells("B5:G92");
  await moddoc.loadInfo();
  await moddoc.sheetsByIndex[0].loadCells("A1:K2000");
  await moddoc.sheetsByIndex[1].loadCells("A1:C200");
  await moddoc.sheetsByIndex[2].loadCells("A1:F75");
}

setTimeout(loadSheet, 0);
setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[0];
  // await sheet.loadCells("AA2:AL15");
  const leaderboard = _.range(2, 16, 2).map((row) => ({
    name: sheet.getCellByA1(`AA${row}`).value,
    score: sheet.getCellByA1(`AG${row}`).value,
    tiebreakScore: sheet.getCellByA1(`AL${row}`).value,
  }));
  return leaderboard;
}

async function getGuessLeaderboard() {
  const sheet = moddoc.sheetsByIndex[1];
  const leaderboard = _.range(2, 200, 1).map((row) => ({
    name: sheet.getCellByA1(`A${row}`).value,
    score: sheet.getCellByA1(`B${row}`).value,
    acc: sheet.getCellByA1(`C${row}`).value,
  }));
  return leaderboard;
}

async function getFantasyLeaderboard() {
  const sheet = doc.sheetsByIndex[5];
  const leaderboard = _.range(5, 93, 1).map((row) => ({
    mod: sheet.getCellByA1(`B${row}`).value,
    team: sheet.getCellByA1(`D${row}`).value,
    name: sheet.getCellByA1(`E${row}`).value,
    score: sheet.getCellByA1(`F${row}`).value,
    gamesWon: sheet.getCellByA1(`G${row}`).value,
  }));
  return leaderboard;
}

async function getPersonalStats(player) {
  const sheet = moddoc.sheetsByIndex[0];
  return _.range(1, 2000)
    .map((row) => {
      if (
        sheet.getCell(row, 0).value === null ||
        sheet.getCell(row, 1).value !== player ||
        sheet.getCell(row, 10).value == null
      )
        return null;
      let game;
      if (Number.isInteger(parseFloat(sheet.getCell(row, 3).value))) {
        game = sheet.getCell(row, 3).value;
      } else {
        const subGameList = ["A", "B", "C"];
        const subGame =
          subGameList[
            (parseFloat(sheet.getCell(row, 3).value) % 1).toFixed(1) * 10 - 1
          ];
        game = [parseInt(sheet.getCell(row, 3).value), subGame].join("");
      }
      return {
        line: sheet.getCell(row, 2).value,
        game,
        points: sheet.getCell(row, 10).value,
      };
    })
    .filter((guess) => guess);
}

async function getBestGuess(game) {
  const sheet = moddoc.sheetsByIndex[2];
  const rows = await sheet.getRows();
  for (let i = 0; i < 75; i++) {
    if (parseFloat(rows[i]._rawData[0]) === game) {
      return rows[i]._rawData;
      break;
    }
  }
}

async function getSchedule() {
  const sheet = doc.sheetsByIndex[1];
  // await sheet.loadCells("A1:S23");
  const dayNameCells = [
    ..._.range(1, 13, 2).map((num) => [2, num]),
    ..._.range(1, 13, 2).map((num) => [15, num]),
  ];
  const dayNames = dayNameCells.map(
    (name) => sheet.getCell(name[0], name[1]).value
  );

  const YEAR = await getYear();
  const MONTH = await getMonth();

  const schedule = dayNames.map((name, idx) => {
    const day = parseInt(name.match(/\d+/)[0]);
    const date =
      day < 20
        ? new Date(Date.UTC(YEAR, MONTH + 1, day))
        : new Date(Date.UTC(YEAR, MONTH, day));
    let cellTime;
    return {
      number: idx + 1,
      date,
      games: _.range(0, 5).map((row) => {
        cellTime =
          sheet.getCell(
            dayNameCells[idx][0] + 1 + 2 * row,
            dayNameCells[idx][1] + 1
          ).value || cellTime; // fallback to last read cellTime

        const cellHours = parseInt(cellTime.match(/\d+/)[0]) - 1; //this -1 and the !=11 below it are to deal
        const am = cellTime.match(/AM/) != null && cellHours != 11; //with GMT+1 scheduling. Very bad.
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
            ? day < 20
              ? new Date(Date.UTC(YEAR, MONTH + 1, day + 1, cellHours % 12))
              : new Date(Date.UTC(YEAR, MONTH, day + 1, cellHours % 12))
            : day < 20
            ? new Date(Date.UTC(YEAR, MONTH + 1, day, (cellHours % 12) + 12))
            : new Date(Date.UTC(YEAR, MONTH, day, (cellHours % 12) + 12)),
        };
      }),
    };
  });
  return schedule;
}

async function getGames() {
  const sheet = doc.sheetsByIndex[2];
  const emojis = await getTeamEmojis();
  return _.range(1, 100)
    .map((row) => {
      if (sheet.getCell(row, 1).value === null) return null;

      const played =
        sheet.getCell(row, 9).value && sheet.getCell(row, 9).value.length > 0;

      const mode = sheet.getCell(row, 1).value.replace(/\s/g, "");

      let number = sheet.getCell(row, 0).value;
      let subGame;
      if (mode === "Silent" || mode === "Bullet") {
        const subGameCell = sheet.getCell(row, 2).value;
        number = parseInt(subGameCell.replace(/[^\d]/g, ""));
        subGame = subGameCell.replace(/\s/g, "").slice(-1);
      } else {
        number = parseInt(number.replace(/[^\d]/g, ""));
      }

      if (!played) {
        return {
          number,
          played,
        };
      }

      const winner = sheet.getCell(row, 9).value.replace(/\s/g, "");
      const fasWin = winner === "F";
      const hitler = parseInt(sheet.getCell(row, 8).value) - 1;
      const fascist1 = parseInt(sheet.getCell(row, 6).value) - 1;
      const fascist2 = parseInt(sheet.getCell(row, 7).value) - 1;
      const players = _.range(0, 7).map(
        (i) => `${emojis[i]} ${sheet.getCell(row, 11 + i).value}`
      );

      const fascists = [players[hitler], players[fascist1], players[fascist2]];
      const liberals = players.filter((p) => !fascists.includes(p));

      let winners = [];
      if (fasWin) {
        winners = fascists;
      } else {
        winners = liberals;
      }

      return {
        number,
        played,
        fasWin,
        link: sheet.getCell(row, 10).value,
        players,
        hitler,
        fascist1,
        fascist2,
        winners,
        mode,
        subGame,
      };
    })
    .filter((game) => game);
}

async function getPlayers() {
  const sheet = doc.sheetsByIndex[4];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 15 * 7; i++) {
    teamName = sheet.getCell(i + 8, 2).value || teamName;
    players.push({
      name: sheet.getCell(i + 8, 3).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 8, 4).value,
      gamesWon: sheet.getCell(i + 8, 5).value,
      winrate: sheet.getCell(i + 8, 6).value,
      personalScore: sheet.getCell(i + 8, 7).value,
      // deductionValue: sheet.getCell(i + 8, 8).value,
      // gameDeductions: sheet.getCell(i + 8, 9).value,
      // personalDeductions: sheet.getCell(i + 8, 10).value,
    });
  }
  return players;
}

async function recordGuess(user, guess, game) {
  const sheet = moddoc.sheetsByIndex[0];
  const timestamp = new Date(new Date().getTime());
  const release = await lineGuessMutex.acquire();
  const rows = await sheet.getRows();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (
      rows[i]._rawData[1] === user &&
      parseFloat(rows[i]._rawData[3]) === game
    ) {
      await rows[i].delete();
      break;
    } else if (parseFloat(rows[i]._rawData[3]) !== game && game < 59) {
      break;
    } else if (game > 58 && parseFloat(rows[i]._rawData[3]) === 58) {
      break;
    }
  }
  await sheet.addRow([timestamp, user, guess, game]);
  release();
}

module.exports = {
  getLeaderboard,
  getGuessLeaderboard,
  getFantasyLeaderboard,
  getPersonalStats,
  getBestGuess,
  getSchedule,
  getGames,
  getPlayers,
  getUpdateTime,
  recordGuess,
};
