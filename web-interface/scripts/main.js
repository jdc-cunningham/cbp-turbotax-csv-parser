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

const sortBuySellRowsCombineDate = (csvRows) => {
  csvRows.forEach(csvRow => {
    const csvRowCols = csvRow.split(',');
    const currency = csvRowCols[6]; // size unit
    const activeDate = csvRowCols[4].split("T")[0];

    if (currency in sortedFills) {
      if (activeDate in sortedFills[currency]) {
        sortedFills[currency][activeDate].push(csvRowCols);
      } else {
        sortedFills[currency][activeDate] = [csvRowCols]
      }
    } else {
      sortedFills[currency] = {};
      sortedFills[currency][activeDate] = [csvRowCols]
    }
  });

  return sortedFills;
}

const renderBuySellRows = (sortedBuySellRows) => {
  console.log(sortedBuySellRows);
  step3.innerHTML = "";
  step3.classList = "flex-grow";

  const currencyBalance = {};
  const currencyGains = {};
  const buyRows = {};
  const sellRows = {};

  // if the subtraction of rows is working properly
  // the first sellRow should match txDate
  const processSell = (currency, txDate, size, buyRowsAll, sellRowsAll) => {
    const buyRows = buyRowsAll[currency];
    const sellRows = sellRowsAll[currency];
    const firstBuyRow = buyRows[0];
    const firstSellRow = sellRows[0];

    if (txDate === firstSellRow[4].split('T')[0]) {
      if (firstBuyRow[5] === size) {
        currencyGains = firstSellRow[9] + firstBuyRow[9];
        buyRows[currency].shift();
        sellRows[currency].shift();

        return currencyGains[currency];
      }
    }
  }

  step3.innerHTML = Object.keys(sortedBuySellRows).map(currency => {
    currencyBalance[currency] = 0;

    if (!(currency in buyRows)) buyRows[currency] = [];
    if (!(currency in sellRows)) sellRows[currency] = []; 
    if (!(currency in currencyGains)) buyRows[currency] = 0;

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
      ${Object.keys(sortedBuySellRows[currency]).map(txDate => (
        `<div class="transaction__date-set">
          <div class="transaction__date">
            ${txDate}
          </div>
          <div class="transaction__date-set-rows">
            ${sortedBuySellRows[currency][txDate].map(txRow => {
              const side = txRow[3];
              const size = txRow[5];
              const cost = txRow[9];

              currencyBalance[currency] += parseFloat((side === 'SELL') ? (-1 * size) : size);

              if (side === 'SELL') {
                sellRows[currency].push(txRow); // this is duplicate ops
              } else {
                buyRows[currency].push(txRow);
              }
 
              return `<div class="transaction__date-set-row">
                <span class="side ${side === 'SELL' ? 'red' : 'green'}">${side}</span>
                <span class="amount">${size}</span>
                <span class="cost">${cost}</span>
                <span class="balance">${roundSize(currencyBalance[currency])}</span>
                <span class="gain">${side === 'SELL' ? processSell(currency, txDate, size, buyRows, sellRows) : ''}</span>
              </div>`
            }).join("")}
          </div>
        </div>`
      )).join("")}
    </div>`
  }).join("");
}

const processBuySellRows = () => {
  const sortedBuySellRows = sortBuySellRowsCombineDate(csvRows);
  renderBuySellRows(sortedBuySellRows);
}

// for development only
processBuySellRows();