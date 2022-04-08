// assumptions:
// anytime an operation is done that can change decimal places, round

// let csvRows = [];
let activeStep = 3;
const sortedFills = {};
const groupedBuySellRows = {};
const currencyGains = {};

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

// data is array of arrays: Currency Name, Purchase Date, Cost Basis, Date Sold, Proceeds
// https://stackoverflow.com/a/14966131/2710227
const generateCsv = (data) => {
  let csvContent = "data:text/csv;charset=utf-8,";

  data.forEach(csvRow => {
    let row = csvRow.join(",");
    csvContent += row + "\r\n";
  });

  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}

const sortBuySellRowsCombineDate = (csvRows) => {
  csvRows.forEach(csvRow => {
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
  step3.innerHTML = "";
  step3.classList = "flex-grow";

  const currencyBalance = {};

  step3.innerHTML = Object.keys(sortedBuySellRows).map(currency => {
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
const getSellMatch = (currency, saleSize, saleDate) => {
  const sellMatch = [];
  let loopCounter = 0; // set max

  const addBuy = () => {
    loopCounter += 1;

    if (loopCounter > 100) { // looping isn't a bad thing as long as it ends
      console.log('fail', currency, saleDate, saleSize);
      console.log(sellMatch);
      return;
    }

    const firstBuyRow = groupedBuySellRows[currency].buy[0];
    const firstBuyRowDate = firstBuyRow?.split(',')[4].split('T')[0];

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
        console.log('>', sellMatch);
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
  let saleCounter = 0;
  Object.keys(groupedBuySellRows).forEach(currency => {
    // if (currency === "ETH") {
      groupedBuySellRows[currency].sell.forEach(saleTx => {
        saleCounter += 1;
        const saleTxInfo = saleTx.split(',');
        const saleDate = saleTxInfo[4].split('T')[0];
        const saleSize = roundSize(saleTxInfo[5]);
        const saleCost = roundCost(saleTxInfo[9]);
        const sellMatch = getSellMatch(currency, saleSize, saleDate);
        const buyBasis = getTotalCostBasis(sellMatch);
        console.log(currency, 'match', saleDate, saleSize, buyBasis);

        if (!(saleDate in currencyGains[currency])) {
          currencyGains[currency][saleDate] = 0;
        }

        currencyGains[currency][saleDate] += (roundSize(saleCost + buyBasis[1]));
      });
    // }
  });

  console.log('sales', saleCounter);

  console.log(currencyGains);

  console.log(sumGains(currencyGains['ADA']));
  console.log(sumGains(currencyGains['ETH']));
  console.log(sumGains(currencyGains['BTC']));
}

const processBuySellRows = () => {
  const sortedBuySellRows = sortBuySellRowsCombineDate(csvRows);
  processTransactions();
  renderBuySellRows(sortedBuySellRows);
  // generateCsv();
  // renderBuySellRows(sortedBuySellRows);
}

// for development only
processBuySellRows();