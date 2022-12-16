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
//globaldoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
//namesdoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);

let updateTime = new Date(new Date().getTime());
const lineGuessMutex = new Mutex();

async function loadSheet() {
  updateTime = new Date(new Date().getTime());
  await doc.loadInfo();
  await doc.sheetsByIndex[0].loadCells("B3:C14"); //The borders of the Leaderboard on main sheet
  await doc.sheetsByIndex[4].loadCells("B3:F50"); //The borders of the Schedule on main sheet
  await doc.sheetsByIndex[1].loadCells("B2:Y51"); //The relevant portion of the Importer, including the leaderboard
  await doc.sheetsByIndex[2].loadCells("A1:I69"); //The borders of the Personal Scores Block
  await doc.sheetsByIndex[6].loadCells("A5:H45"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByIndex[0].loadCells("A1:G2000");
  await moddoc.sheetsByIndex[1].loadCells("A1:C200");
  await moddoc.sheetsByIndex[2].loadCells("C1:H60");
  //await namesdoc.loadInfo();
  //await namesdoc.sheetsByIndex[0].loadCells("J1:R348");
  //await globaldoc.loadInfo();
  //await globaldoc.sheetsByIndex[2].loadCells("A1:AZ341");
}

setTimeout(loadSheet, 0);
setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[0];
  const leaderboard = _.range(0, 6).map((row) => ({
    name: sheet.getCellByA1(`B${3 + row * 2}`).value, //Column has to be leftmost column of leaderboard
    score: sheet.getCellByA1(`C${3 + row * 2}`).value, //Number has to be the position of the top score in the Reformat block
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
  const leaderboard = _.range(5, 46, 1).map((row) => ({
    mod: '',
    team: sheet.getCellByA1(`C${row}`).value,
    name: sheet.getCellByA1(`D${row}`).value,
    score: sheet.getCellByA1(`E${row}`).value,
    gamesWon: sheet.getCellByA1(`H${row}`).value,
    pointsPerGame:
      Math.round(
        (sheet.getCellByA1(`E${row}`).value /
          sheet.getCellByA1(`G${row}`).value) *
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
        sheet.getCell(row, 5).value == null
      )
        return null;
      return {
        merlin: sheet.getCell(row, 2).value,
        game: sheet.getCell(row, 3).value,
        correct: sheet.getCell(row, 5).value === 1 ? "Correct" : "Incorrect",
      };
    })
    .filter((guess) => guess);
}

async function getBestGuess(game) {
  const sheet = moddoc.sheetsByIndex[0];
  const sheet2 = moddoc.sheetsByIndex[2];
  let guesserList = [];
  for (let i = 2; i < 2000; i++) {
    if (sheet.getCellByA1(`A${i}`).value === null) break;
    if (
      sheet.getCellByA1(`D${i}`).value === game &&
      sheet.getCellByA1(`F${i}`).value === 1
    ) {
      guesserList.push(sheet.getCellByA1(`B${i}`).value);
    }
  }
  return {
    guesserList,
    merlin: sheet2.getCellByA1(`C${game + 1}`).value,
    average: sheet2.getCellByA1(`E${game + 1}`).value,
    guessnum: sheet2.getCellByA1(`F${game + 1}`).value,
    falsenum: sheet2.getCellByA1(`G${game + 1}`).value,
    mostfalse: sheet2.getCellByA1(`H${game + 1}`).value,
  };
}

async function getSchedule() {
  const sheet = doc.sheetsByIndex[4];
  //await sheet.loadCells("A1:S23");
  const dayGames = [5, 6, 5, 5, 5, 5, 5, 6, 6];
  console.log(sheet.getCellByA1(`B${dayGames.slice(8, 0).reduce((a, b) => a + b, 0) + 3}`).value);
  const dayNames = _.range(0, 9).map(
    (num) =>
      sheet.getCellByA1(
        `B${dayGames.slice(0, num).reduce((a, b) => a + b, 0) + 3}`
      ).value
  );
  const modeNames = {
    R: "Regular",
    D: "Duo",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    A: "Anonymous",
    B: "Bullet",
    "D+": "Duo +",
  };

  const YEAR = await getYear();
  const MONTH = await getMonth();

  const schedule = dayNames.map((name, idx) => {
    const day = parseInt(name.match(/\d+/)[0]);
    const date = new Date(Date.UTC(YEAR, MONTH, day));
    let cellTime;
    return {
      number: idx + 1,
      date,
      games: _.range(0, dayGames[idx]).map((row) => {
        cellTime =
          sheet.getCellByA1(
            `F${dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 3}`
          ).formattedValue || cellTime;
        //.getCell(
        //dayGames.slice(0,idx).reduce((a, b) => a + b, 0) + row + 2,
        //4
        //).value || cellTime; // fallback to last read cellTime
        const cellHours = parseInt(cellTime.match(/\d+/)[0]); //yay for no daylight savings
        const am = cellTime.match(/AM/) != null; //got rid of some BS on these lines
        return {
          type: modeNames[
            sheet.getCellByA1(
              `D${dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 3}`
            ).value
          ],
          number: dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 1,
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
  const sheet = doc.sheetsByIndex[1];
  const emojis = await getTeamEmojis();
  const modeNames = {
    R: "Regular",
    D: "Duo",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    A: "Anonymous",
    B: "Bullet",
    "D+": "Duo +",
  };
  return _.range(0, 48) //Has to be one more than the number of rows in Inporter
    .map((row) => {
      if (sheet.getCellByA1(`C${row + 4}`).value === null) return null;
      const played =
        sheet.getCellByA1(`Y${row + 4}`).value &&
        sheet.getCellByA1(`Y${row + 4}`).value.length > 0;

      const mode = modeNames[sheet.getCellByA1(`D${row + 4}`).value];

      let number = sheet.getCellByA1(`C${row + 4}`).value;

      if (!played) {
        return {
          number,
          played,
        };
      }

      const winner = sheet.getCellByA1(`Y${row + 4}`).value;
      const spyWin = winner === "Spies";
      const spyIndexes = _.range(0, 6).filter((i) =>
        ["Assassin", "Morgana"].includes(
          sheet.getCell(row + 3, 7 + i * 3).value
        )
      );
      const players = _.range(0, 6).map(
        (i) => `${emojis[i]} ${sheet.getCell(row + 3, 6 + i * 3).value}`
      );

      const spies = [players[spyIndexes[0]], players[spyIndexes[1]]];
      const resistance = players.filter((p) => !spies.includes(p));

      let winners = [];
      if (spyWin) {
        winners = spies;
      } else {
        winners = resistance;
      }

      return {
        number,
        played,
        spyWin,
        //link: sheet.getCell(row, 9).value,
        players,
        spyIndexes,
        winners,
        mode,
      };
    })
    .filter((game) => game);
}

async function getPlayers() {
  const sheet = doc.sheetsByIndex[2];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 11 * 6; i++) {
    teamName = sheet.getCell(i + 3, 1).value || teamName;
    players.push({
      name: sheet.getCell(i + 3, 2).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 3, 3).value,
      gamesWon: sheet.getCell(i + 3, 4).value,
      winrate: sheet.getCell(i + 3, 5).value,
      personalScore: sheet.getCell(i + 3, 8).value,
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
