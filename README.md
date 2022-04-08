### About

This is a web-based CSV parser to transform an exported `fills.csv` file from CBP to import into Turbotax.

This is using a FIFO method to generate the buy-sell rows. The application is visual in nature so that you can verify the values.

### Try it
Click on this link to go to the github hosted site. The code used is this folder.

### Things to consider for accuracy
* if you have an existing balance from a prior year, that needs to be factored in
  * this code doesn't deal with that right now
* if you transferred in crypto that you didn't buy in CBP
* if you withdrew crypto from your wallet but did not sell it

In all of the above you would have to find any relevant rows in the `fills.csv` file and take those rows out because they will mess up any calculations performed. Or in the case of existing balances from the previous year, add them in. I will have to figure that out next year as I have left over balances not sold in 2021 that were later sold in 2022.

### Privacy
This does not upload your CSV file, it uses the `FileReader` API that can load a file in the browser and use it.

### Disclaimer
This is free software, no guarantees. I am not a tax expert or anything. The primary causes of errors include the things to consider list above and rounding/dealing with decimal places eg. 0.00000001 left over.

Use at your own risk.