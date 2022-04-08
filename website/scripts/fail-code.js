// const buyPool = []; // keeps track of remainder
//       currencyGains["ADA"] = {}; // date: gain

//       groupedBuySellRows["ADA"].sell.forEach(saleTxRow => {
//         const saleTxInfo = saleTxRow.split(',');
//         const saleSize = saleTxInfo[5];
//         const saleCost = saleTxInfo[9];
//         const saleDate = saleTxInfo[4].split('T')[0];
//         const buyPoolSize = buyPool.length ? getTotalSize(buyPool) : 0;

//         if (!buyPool.length || buyPoolSize < saleSize) {
//           const nextBuyRowInfo = groupedBuySellRows["ADA"].buy[0].split(',');
//           const nextBuyRowSize = nextBuyRowInfo[5];
//           const nextBuyRowCost = nextBuyRowInfo[9];

//           if (buyPoolSize + nextBuyRowSize > saleSize) {
//             // add remainder/match cost basis
//             const remainderSize = roundSize(saleSize - (buyPoolSize + nextBuyRowSize));
//             const remainderSizeCostBasis = remainderSize * (nextBuyRowSize / (-1 * parseFloat(nextBuyRowCost)));

//             nextBuyRowInfo[5] = roundSize(nextBuyRowSize - remainderSize);
//             nextBuyRowInfo[9] = roundCost(nextBuyRowCost - remainderSizeCostBasis);

//             buyPool.push([
//               remainderSize,
//               remainderSizeCostBasis
//             ]);
//           } else {
//             buyPool.push([
//               nextBuyRowInfo[5],
//               nextBuyRowInfo[9]
//             ]);

//             groupedBuySellRows["ADA"].buy.shift();
//           }
//         }

//         console.log(getTotalSize(buyPool), parseFloat(saleSize));

//         if (getTotalSize(buyPool) === parseFloat(saleSize)) {
//           currencyGains["ADA"][saleDate] = roundCost(parseFloat(saleCost) + parseFloat(getTotalSize(buyPool)));
//           buyPool.length = 0;
//         }
//       });