// let csvRows = [];
let activeStep = 3;

const startBtn = document.getElementById('start');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

startBtn.addEventListener('click', () => {
  activeStep = 2;
  step1.classList = "hidden";
  step2.classList = "";
});

const sortBuySellRowsByDate = (csvRows) => {
  csvRows.forEach(csvLine)
  const currency = csvRow[6]; // size unit
  const side = csvRow[3].toLowerCase();

  if (currency in sortedFills) {
    if (side in sortedFills[currency]) {
      sortedFills[currency][side].push(csvRow);
    } else {
      sortedFills[currency][side] = [csvRow];
    }
  } else {
    sortedFills[currency] = {};
    sortedFills[currency][side] = [csvRow];
  }
}

const renderBuySellRows = () => {
  const buySellGroups = sortBuySellRowsByDate(csvRows);
}

// for development only
renderBuySellRows();