### About

This is a web-based CSV parser to transform an exported `fills.csv` file from CBP to import into Turbotax.

This is using a FIFO method to generate the buy-sell rows. The application is visual in nature so that you can verify the values.

### Try it
Click on this link to go to the github hosted site. The code used is this folder.

### Things to consider
* if you have an existing balance from a prior year
* if you transferred crypto that you didn't buy in this portfolio/in CBP
* if you withdrew crypto from your wallet but did not sell it

In all of the above you would have to find any relevant rows in the `fills.csv` file and take those rows out because they will mess up any calculations performed.

### Privacy
This does not upload your CSV file, it uses the `FileReader` API that can load a file in the browser and use it.

### Disclaimer
This is free software, no guarantees. I am not a tax expert or anything. The primary causes of errors include the things to consider list above and rounding/dealing with decimal places.

Use at your own risk.