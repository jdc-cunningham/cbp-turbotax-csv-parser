### About

This is a web-based CSV parser to transform an exported `fills.csv` file from Coinbase Pro for import into Turbotax.

This is using a FIFO method to generate the buy-sell rows. The application is visual in nature so that you can verify the values.

### Try it
Click on this <a href="https://jdc-cunningham.github.io/cbp-turbotax-csv-parser/">link</a> to go to the github hosted site. The code used is the [docs folder](https://github.com/jdc-cunningham/cbp-turbotax-csv-parser/tree/master/docs).

### Things to consider for accuracy
* if you have an existing balance from a prior year, that needs to be factored in
  * this code doesn't deal with that right now
* if you transferred in crypto that you didn't buy in CBP
* if you withdrew crypto from your wallet but did not sell it

In all of the above you would have to find any relevant rows in the `fills.csv` file and take those rows out because they will mess up any calculations performed. Or in the case of existing balances from the previous year, add them in. I will have to figure that out next year as I have left over balances not sold in 2021 that were later sold in 2022.

Also I will note the buys are batched with regard to the cost basis/proceeds rows for Turbotax. So if you bought some currency at 04/01/2021 and 04/02/2021, both of those total the amount sold on 04/03/2021, then there would be 1 row, the buy date being 04/01/2021(earliest) and sale date of 04/03/2021. You could instead have two rows with the sales separated/matching each buy row. The gains calculated in the end is the same but less rows in the Turbotax CSV.

### Privacy
This does not upload your CSV file, it uses the `FileReader` API that can load a file in the browser and use it.

### Disclaimer
This is free software, no guarantees. I am not a tax expert or anything. The primary causes of errors include the things to consider list above and rounding/dealing with decimal places eg. 0.00000001 left over.

Use at your own risk.