// assumptions:
// anytime an operation is done that can change decimal places, round

let csvRows = [];
let activeStep = 1;
let saleCounter = 0;

const sortedFills = {};
const groupedBuySellRows = {};
const currencyGains = {};
const csvData = {};

const startBtn = document.getElementById('start');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');
const step3Disp = document.getElementById('step-3-display');
const step3Nav = document.querySelector('.step-3__nav');
const generateCsvBtn = document.getElementById('generate-csv-btn');
const summary = document.getElementById('summary');
const summaryDisp = document.getElementById('summary-display');
const hideSummaryBtn = document.getElementById('hide-summary');

startBtn.addEventListener('click', () => {
  activeStep = 2;
  step1.classList = "hidden";
  step2.classList = "";
});

generateCsvBtn.addEventListener('click', () => {
  if (!csvRows.length) {
    alert('No data');
    return;
  }

  generateCsv();
});

hideSummaryBtn.addEventListener('click', () => {
  summary.classList = "hidden";
});

const absVal = val => val < 0 ? -1 * val : val;
const roundSize = (val, len = 0) => typeof val === 'number' ? parseFloat(val.toFixed(len || 8)) : parseFloat(parseFloat(val).toFixed(len || 8));
const roundCost = val => typeof val === 'number' ? parseFloat(val.toFixed(6)) : parseFloat(parseFloat(val).toFixed(6));

// data is array of arrays: Currency Name, Purchase Date, Cost Basis, Date Sold, Proceeds
// https://stackoverflow.com/a/14966131/2710227
const generateCsv = () => {
  let csvContent = "data:text/csv;charset=utf-8,";

  csvContent += `Currency Name, Purchase Date, Cost Basis, Date Sold, Proceeds` + "\r\n";

  Object.keys(csvData).forEach(currency => {
    Object.keys(csvData[currency]).forEach(saleDate => {
      Object.keys(csvData[currency][saleDate]).forEach(saleCounter => {
        let row = `${currency}, ${csvData[currency][saleDate][saleCounter].buyDate}, ${csvData[currency][saleDate][saleCounter].costBasis}, ${saleDate}, ${csvData[currency][saleDate][saleCounter].proceeds}`;
        csvContent += row + "\r\n";
      });
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.style.display = "none";
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", 'cbp-fills-to-turbotax.csv');
  document.body.appendChild(link); // Required for FF
  link.click();
}

const sortBuySellRowsCombineDate = () => {
  csvRows.forEach(csvRow => {
    if (!csvRow) return;

    const csvRowCols = csvRow.split(',');
    const currency = csvRowCols[6]; // size unit
    const activeDate = csvRowCols[4].split("T")[0];
    const side = csvRowCols[3];

    if (currency in sortedFills) {
      if (activeDate in sortedFills[currency]) {
        sortedFills[currency][activeDate].push(csvRowCols);
      } else {
        sortedFills[currency][activeDate] = [csvRowCols];
      }
    } else {
      sortedFills[currency] = {};
      sortedFills[currency][activeDate] = [csvRowCols];
      currencyGains[currency] = {};
      groupedBuySellRows[currency] = {
        buy: [],
        sell: []
      };
    }

    groupedBuySellRows[currency][side.toLowerCase()].push(csvRow);
  });

  return sortedFills;
}

const renderBuySellRows = (sortedBuySellRows) => {
  step3Disp.innerHTML = "";
  step3Disp.classList = "flex-grow";

  const currencyBalance = {};

  step3Disp.innerHTML = Object.keys(sortedBuySellRows).map(currency => {
    currencyBalance[currency] = 0;
    const renderedSaleDates = {};

    return `<div class="transaction">
      <div class="transaction__currency">${currency}</div>
      <div class="transaction__header">
        <span class="date">DATE</span>
        <span class="side">SIDE</span>
        <span class="size">SIZE</span>
        <span class="cost">COST</span>
        <span class="wallet">BALANCE</span>
        <span class="gain">GAIN</span>
      </div>
      ${Object.keys(sortedBuySellRows[currency]).map(txDate => {
        return `<div class="transaction__date-set">
          <div class="transaction__date">
            ${txDate}
          </div>
          <div class="transaction__date-set-rows">
            ${sortedBuySellRows[currency][txDate].map(txRow => {
              let sellGains = '';

              if (txRow[3] === 'SELL' && !(txDate in renderedSaleDates)) {
                renderedSaleDates[txDate] = true;
                sellGains = `T ${roundCost(currencyGains[currency][txDate])}`;
              }

              currencyBalance[currency] += parseFloat((txRow[3] === 'SELL') ? (-1 * txRow[5]) : txRow[5]);

              return `<div class="transaction__date-set-row">
                <span class="side ${txRow[3] === 'SELL' ? 'red' : 'green'}">${txRow[3]}</span>
                <span class="amount">${txRow[5]}</span>
                <span class="cost">${txRow[9]}</span>
                <span class="balance">${roundSize(currencyBalance[currency])}</span>
                <span class="gain">
                  ${(txRow[3] === 'SELL') ? sellGains : ''}
                </span>
              </div>`
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>`
  }).join("");

  step3Nav.classList = "step-3__nav";

  console.log(csvData);

  Object.keys(currencyGains).forEach(currency => {
    summaryDisp.innerHTML += `<h2>${currency} $${parseFloat(sumGains(currencyGains[currency]).toFixed(2)).toLocaleString()}</h2>`
  });

  summary.classList = "";
}

const getTotalSize = (arrayOfSizes) => (
  !arrayOfSizes.length ? 0 : arrayOfSizes.map(row => row[0]).reduce((a, b) => a+b)
);

const getTotalCost = (arrayOfSizes) => (
  !arrayOfSizes.length ? 0 : arrayOfSizes.map(row => row[1]).reduce((a, b) => a+b)
);

// this will count up to the sale size,
// adding buy sizes with proportional fractional cost-basis
// limited by size and date
// this also reduces the reference whether by whole rows or partial
const getSellMatch = (currency, saleSize, saleDate, saleCounter) => {
  const sellMatch = [];
  let loopCounter = 0; // set max

  if (!(currency in csvData)) {
    csvData[currency] = {};
  }

  if (!(saleDate in csvData[currency])) {
    csvData[currency][saleDate] = {};
  }

  const addBuy = () => {
    loopCounter += 1;

    if (loopCounter > 100) { // looping isn't a bad thing as long as it ends
      console.log('non-ending loop fail', currency, saleDate, saleSize);
      console.log(sellMatch);
      return;
    }

    const firstBuyRow = groupedBuySellRows[currency].buy[0];
    const firstBuyRowDate = firstBuyRow?.split(',')[4].split('T')[0];

    if (!(saleCounter in csvData[currency][saleDate])) {
      csvData[currency][saleDate][saleCounter] = {
        buyDate: firstBuyRowDate
      };
    }

    if ((firstBuyRow && saleDate >= firstBuyRowDate) && (!sellMatch.length || getTotalSize(sellMatch) < saleSize)) {
      const oldestBuy = firstBuyRow;
      const oldestBuyInfo = oldestBuy.split(',');
      const oldestBuySize = roundSize(oldestBuyInfo[5]);
      const oldestBuyCost = roundCost(oldestBuyInfo[9]);
      const nextBuySize = roundSize(getTotalSize(sellMatch) + oldestBuySize);

      if (nextBuySize <= saleSize) {
        sellMatch.push([oldestBuySize, oldestBuyCost]);
        groupedBuySellRows[currency].buy.shift();
      } else {
        const fillerSize = saleSize - getTotalSize(sellMatch);
        const fillerCost = roundCost(fillerSize * (oldestBuyCost / oldestBuySize));

        // reduce original
        oldestBuyInfo[5] = roundSize(oldestBuySize - fillerSize);
        oldestBuyInfo[9] = roundCost(oldestBuyCost - fillerCost);
        groupedBuySellRows[currency].buy[0] = oldestBuyInfo.join(",");

        sellMatch.push([
          fillerSize,
          fillerCost
        ]);
      }

      addBuy();
    }
  }

  addBuy();

  return sellMatch;
}

const getTotalCostBasis = (addedBuys) => {
  let totalSize = 0;
  let totalCost = 0;

  addedBuys.forEach(addedBuy => {
    totalSize += addedBuy[0];
    totalCost += addedBuy[1];
  });

  return [totalSize, totalCost];
}

const sumGains = (dateGainObj) => {
  return Object.keys(dateGainObj).length ? Object.keys(dateGainObj).map(date => dateGainObj[date]).reduce((a, b) => a+b) : 0
}

const processTransactions = () => {
  Object.keys(groupedBuySellRows).forEach(currency => {
    groupedBuySellRows[currency].sell.forEach(saleTx => {
      saleCounter += 1;
      const saleTxInfo = saleTx.split(',');
      const saleDate = saleTxInfo[4].split('T')[0];
      const saleSize = roundSize(saleTxInfo[5]);
      const saleCost = roundCost(saleTxInfo[9]);
      const sellMatch = getSellMatch(currency, saleSize, saleDate, saleCounter);
      const buyBasis = getTotalCostBasis(sellMatch);

      console.log(currency, saleDate);

      if (!(saleDate in currencyGains[currency])) {
        currencyGains[currency][saleDate] = 0;
      }

      currencyGains[currency][saleDate] += (roundSize(saleCost + buyBasis[1]));
      csvData[currency][saleDate][saleCounter] = {
        ...csvData[currency][saleDate][saleCounter],
        costBasis: buyBasis[1],
        proceeds: saleCost,
      }
    });
  });
}

const processBuySellRows = () => {
  const sortedBuySellRows = sortBuySellRowsCombineDate();
  processTransactions();
  renderBuySellRows(sortedBuySellRows);
}