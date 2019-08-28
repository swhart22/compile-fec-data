# FEC Campaign Fundraising Data Compiler

This is a Node script that downloads fundraising data for the 2020 presidential candidates, compiles it into a csv, and uploads the csv to our FTP server. To run this script on your machine:

##DO ONCE:

### Prep the script

Clone the repository onto your machine:

`git clone https://github.com/swhart22/compile-fec-data.git`

Then install the necessary node packages. Navigate into your directory (if you're not already in it) and:

`npm i`

### Configure environment variables

The script needs three environment variables set in order to run, your FTP host name, FTP user name and FTP password. To set each of these, run the following commands, WITHOUT the brackets:

`export FTPHOST={hostname}`
`export FTPUSER={your username}`
`export FTPPASS={your password}`

### DO EVERY TIME:

Run the script!

`node index.js`

The resulting csv will be uploaded to `/html/national/2019/fec-campaign-data/data/`

