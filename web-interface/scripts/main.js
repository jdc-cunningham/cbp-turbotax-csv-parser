// let csvRows = [];
let activeStep = 3;
const sortedFills = {}; // from CBP fills: portfolio, trade id, product, side, created at, size, size unit, price, fee, total, price/fee/total unit (USD)
// const costBasisTracking = {}; // hierarchy: currency name -> date -> (amount, cost)
// const buySellRows = {}; // date: currency name, purchase date, cost basis, date sold, proceeds

const startBtn = document.getElementById('start');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

startBtn.addEventListener('click', () => {
  activeStep = 2;
  step1.classList = "hidden";
  step2.classList = "";
});

const absVal = val => val < 0 ? -1 * val : val;
const roundSize = (val, len = 0) => typeof val === 'number' ? parseFloat(val.toFixed(len || 8)) : parseFloat(parseFloat(val).toFixed(len || 8));
const roundCost = val => typeof val === 'number' ? parseFloat(val.toFixed(6)) : parseFloat(parseFloat(val).toFixed(6));

const sortBuySellRowsByDate = (csvRows) => {
  csvRows.forEach(csvRow => {
    const csvRowCols = csvRow.split(',');
    const currency = csvRowCols[6]; // size unit
    const side = csvRowCols[3].toLowerCase();

    if (currency in sortedFills) {
      if (side in sortedFills[currency]) {
        sortedFills[currency][side].push(csvRowCols);
      } else {
        sortedFills[currency][side] = [csvRowCols];
      }
    } else {
      sortedFills[currency] = {};
      sortedFills[currency][side] = [csvRowCols];
    }
  });

  return sortedFills;
}

const groupByDate = (sortedFills) => {
  const newObj = {};

  Object.keys(sortedFills).forEach(currency => {
    newObj[currency] = {
      buy: {},
      sell: {}
    };

    Object.keys(sortedFills[currency]).forEach(side => {
      let activeDate = null;

      sortedFills[currency][side].forEach(txRow => {
        const curDate = txRow[4].split('T')[0];
        const size = txRow[5]; // lol genius
        const total = txRow[9];

        if (!activeDate) activeDate = curDate;
        if (curDate !== activeDate) activeDate = curDate;
        
        if (!(activeDate in newObj[currency][side])) {
          newObj[currency][side][activeDate] = [[size, absVal(total)]];
        } else {
          newObj[currency][side][activeDate].push([size, absVal(total)]);
        }
      });
    });
  });

  return newObj;
}

const renderBuySellRows = (buySellDateGroups) => {
  console.log(buySellDateGroups);
  step3.innerHTML = '';
  step3.classList = 'flex-grow';

  Object.keys(buySellDateGroups).forEach(currency => {
    step3.innerHTML +=
      `<div class="bsdg">
        <h2>${currency}</h2>
        ${Object.keys(buySellDateGroups[currency]).map(side => (
          `<div class="bsdg__side">
            <div class="bsdg__side-left">${side}</div>
            <div class="bsdg__side-right">
              ${Object.keys(buySellDateGroups[currency][side]).map(fillDate => (
                `<div class="bsdg__side-right-group">
                  ${buySellDateGroups[currency][side][fillDate].map(tx => (
                    `<div class="bsdg__side-right-group-individual">
                      ${fillDate}
                      ${tx[0]}
                      ${tx[1]}
                    </div>`
                  )).join("")}
                </div>`
              )).join("")}
            </div>
          </div>
          `
        )).join("")}
      </div>`;
  });
}

const processBuySellRows = () => {
  const buySellGroups = sortBuySellRowsByDate(csvRows);
  const buySellDateGroups = groupByDate(buySellGroups);
  renderBuySellRows(buySellDateGroups);
}

// for development only
processBuySellRows();