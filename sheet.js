const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
var Mutex = require("async-mutex").Mutex;
const {
  SHEET_PRIVATE_ID,
  MOD_SHEET_PRIVATE_ID,
  GLOBAL_SHEET_PRIVATE_ID,
  NAMES_SHEET_PRIVATE_ID,
  GOOGLE_API_CREDENTIALS,
} = require("./env");
const {
  getYear,
  getMonth,
  getTeamEmojis,
  getGameNumber,
} = require("./constants");

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(SHEET_PRIVATE_ID);
const moddoc = new GoogleSpreadsheet(MOD_SHEET_PRIVATE_ID);
const globaldoc = new GoogleSpreadsheet(GLOBAL_SHEET_PRIVATE_ID);
const namesdoc = new GoogleSpreadsheet(NAMES_SHEET_PRIVATE_ID);
doc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
moddoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
globaldoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
namesdoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);

let updateTime = new Date(new Date().getTime());
const lineGuessMutex = new Mutex();

async function loadSheet() {
  updateTime = new Date(new Date().getTime());
  await doc.loadInfo();
  await doc.sheetsByIndex[1].loadCells("Y3:AD16"); //The borders of the Leaderboard on main sheet
  await doc.sheetsByIndex[2].loadCells("B1:R18"); //The borders of the Schedule on main sheet
  await doc.sheetsByIndex[5].loadCells("A1:BE100"); //The relevant portion of the Importer, including the leaderboard
  await doc.sheetsByIndex[4].loadCells("A1:O100"); //The borders of the Personal Scores Block
  await doc.sheetsByIndex[6].loadCells("B5:H77"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByIndex[0].loadCells("A1:N2000");
  await moddoc.sheetsByIndex[1].loadCells("A1:C200");
  await moddoc.sheetsByIndex[2].loadCells("A1:F75");
  await namesdoc.loadInfo();
  await namesdoc.sheetsByIndex[0].loadCells("J1:R348");
  await globaldoc.loadInfo();
  await globaldoc.sheetsByIndex[2].loadCells("A1:AZ341");
}

setTimeout(loadSheet, 0);
setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[1];
  const sheet2 = doc.sheetsByIndex[5];
  // await sheet.loadCells("AA2:AL15");
  const leaderboard = _.range(0, 7).map((row) => ({
    name: sheet.getCellByA1(`Y${3 + row * 2}`).value, //Column has to be leftmost column of leaderboard
    score: sheet2.getCellByA1(`A${66 + row}`).value, //Number has to be the position of the top score in the Reformat block
    tiebreakScore: sheet2.getCellByA1(`C${66 + row}`).value, //Same here
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
  const sheet = doc.sheetsByIndex[6];
  const leaderboard = _.range(5, 78, 1).map((row) => ({
    mod: sheet.getCellByA1(`B${row}`).value,
    team: sheet.getCellByA1(`D${row}`).value,
    name: sheet.getCellByA1(`E${row}`).value,
    score: sheet.getCellByA1(`F${row}`).value,
    gamesWon: sheet.getCellByA1(`G${row}`).value,
    pointsPerGame:
      Math.round(
        (sheet.getCellByA1(`F${row}`).value /
          sheet.getCellByA1(`H${row}`).value) *
          100
      ) / 100,
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
        sheet.getCell(row, 12).value == null
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
        points: sheet.getCell(row, 12).value,
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
  const sheet = doc.sheetsByIndex[2];
  // await sheet.loadCells("A1:S23");
  const dayNameCells = [
    ..._.range(4, 17, 3).map((num) => [3, num]),
    ..._.range(1, 17, 3).map((num) => [12, num]),
  ];
  const dayNames = dayNameCells.map(
    (name) => sheet.getCell(name[0], name[1]).value
  );

  const YEAR = await getYear();
  const MONTH = await getMonth();
  const offset = [0, -2, -3, -3, -3, -4, -5, -6, -7, -7, -7];

  const schedule = dayNames.map((name, idx) => {
    const day = parseInt(name.match(/\d+/)[0]);
    const date = new Date(Date.UTC(YEAR, MONTH, day));
    let cellTime;
    return {
      number: idx + 1,
      date,
      games: _.range(0, 5).map((row) => {
        if (
          (idx === 0 && row > 2) ||
          ([1, 4, 5, 6, 7].includes(idx) && row > 3)
        ) {
          //this null return is to account for missing 5th games on some days
          return null;
        }
        cellTime =
          sheet.getCell(
            dayNameCells[idx][0] + 1 + row,
            dayNameCells[idx][1] + 1
          ).value || cellTime; // fallback to last read cellTime
        const cellHours = parseInt(cellTime.match(/\d+/)[0]); //yay for no daylight savings
        const am = cellTime.match(/AM/) != null; //got rid of some BS on these lines
        return {
          type: sheet.getCell(
            dayNameCells[idx][0] + 1 + row,
            dayNameCells[idx][1]
          ).value,
          number: idx * 5 + row + 1 + offset[idx],
          //number: idx < 9 ? idx * 5 + row + 1 : idx * 5 + row, //this switch is to account for missing 5th games on some days
          //parseInt(
          //  sheet
          //    .getCell(dayNameCells[idx][0] + 2 + 2 * row, dayNameCells[idx][1])
          //    .value.match(/\d+/)[0]
          //),
          time: am
            ? new Date(Date.UTC(YEAR, MONTH, day + 1, cellHours % 12)) // also got rid of the BS nested switch in here
            : new Date(Date.UTC(YEAR, MONTH, day, (cellHours % 12) + 12)),
        };
      }),
    };
  });
  return schedule;
}

async function getGames() {
  const sheet = doc.sheetsByIndex[5];
  const emojis = await getTeamEmojis();
  return _.range(1, 58) //Has to be one more than the number of rows in Inporter
    .map((row) => {
      if (sheet.getCell(row, 2).value === null) return null;

      const played =
        sheet.getCell(row, 8).value && sheet.getCell(row, 8).value.length > 0;

      const mode = sheet.getCell(row, 2).value.replace(/\s/g, "");

      let number = sheet.getCell(row, 0).value;
      let subGame;
      if (mode === "Silent" || mode === "Bullet") {
        const subGameCell = sheet.getCell(row, 3).value;
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

      const winner = sheet.getCell(row, 8).value.replace(/\s/g, "");
      const fasWin = winner === "Fascist";
      const hitler = parseInt(sheet.getCell(row, 7).value) - 1;
      const fascist1 = parseInt(sheet.getCell(row, 38).value) - 1;
      const fascist2 = parseInt(sheet.getCell(row, 39).value) - 1;
      const players = _.range(0, 7).map(
        (i) => `${emojis[i]} ${sheet.getCell(row, 10 + i).value}`
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
        link: sheet.getCell(row, 9).value,
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
  for (let i = 0; i < 13 * 7; i++) {
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

async function getGlobalPlayer(player) {
  const names = namesdoc.sheetsByIndex[0];
  const namerows = await names.getRows();
  const sheet = globaldoc.sheetsByIndex[2];
  const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByIndex[4];
  let canonName = "";
  let gName = "";
  let currentName = "";
  let currentInfo = [];
  let pastInfo = [];
  for (let i = 1; i < namerows.length + 1; i++) {
    for (let j = 9; j < 18; j++) {
      // The first number is the index of the current tourney column, the second is the one plus the index of Tourney Name 5
      if (
        names.getCell(i, j).value !== null &&
        names.getCell(i, j).value.toLowerCase() === player
      ) {
        canonName = names.getCell(i, 11).value;
        gName = names.getCell(i, 10).value;
        if (names.getCell(i, 9).value !== null) {
          currentName = names.getCell(i, 9).value;
          let teamName = "";
          for (let k = 0; k < 13 * 7; k++) {
            // It has to be the number of players in each team times seven
            teamName = currentsheet.getCell(k + 8, 2).value || teamName;
            if (currentsheet.getCell(k + 8, 3).value === currentName) {
              currentInfo.push(
                teamName,
                ..._.range(3, 9).map(
                  (entry) => currentsheet.getCell(k + 8, entry).value
                )
              );
            }
          }
        }
        break;
      }
    }
    if (canonName !== "") {
      break;
    }
  }
  for (let i = 5; i < rows.length; i++) {
    if (sheet.getCell(i + 1, 0).value === gName) {
      pastInfo.push(
        ..._.range(0, 52).map((entry) => sheet.getCell(i + 1, entry).value) // Has to be the number of columns in the Global Sheet
      );
    }
  }
  return [canonName, currentInfo, pastInfo];
}

async function recordGuess(user, guess, game) {
  const sheet = moddoc.sheetsByIndex[0];
  const timestamp = new Date(new Date().getTime());
  const release = await lineGuessMutex.acquire();
  const rows = await sheet.getRows();
  const gameNumber = await getGameNumber();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (
      rows[i]._rawData[1] === user &&
      parseFloat(rows[i]._rawData[3]) === game
    ) {
      await rows[i].delete();
      break;
    } else if (
      parseFloat(rows[i]._rawData[3]) !== game &&
      game < gameNumber - 1
    ) {
      break;
    } else if (
      game > gameNumber - 2 &&
      parseFloat(rows[i]._rawData[3]) === gameNumber - 2
    ) {
      break;
    }
  }
  await sheet.addRow([timestamp, user, guess, game]);
  release();
}

async function dumpGuesses(dict) {
  const sheet = moddoc.sheetsByIndex[0];
  var items = Object.keys(dict).map(function (key) {
    return dict[key];
  });

  items.sort(function (first, second) {
    return first[0] - second[0];
  });

  for (const item of items) {
    await sheet.addRow(item);
  }
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
  getGlobalPlayer,
  getUpdateTime,
  recordGuess,
  dumpGuesses,
};
