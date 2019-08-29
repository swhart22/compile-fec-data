# FEC Campaign Fundraising Data Compiler

This is a Node script that downloads fundraising data for the 2020 presidential candidates, compiles it into a csv, and uploads the csv to our FTP server. It is designed so that every time our candidate fundraising table needs to be updated, anyone on our team can run one command from the command line and the prepped, updated `.csv` will upload to our server.

To run this script on your machine:

## DO ONCE:

#### Prep the script

Open up your terminal and run these commands.

Clone the repository onto your machine:

`git clone https://github.com/swhart22/compile-fec-data.git`

Then install the necessary node packages by navigating into your project's directory (if you're not already in it) and running:

`npm i`

#### Configure environment variables

The script needs three environment variables set in order to run, your FTP host name, FTP user name and FTP password. To set each of these, run the following commands:

`export FTPHOST=hostname`

`export FTPUSER=your username`

`export FTPPASS=your password`

## DO EVERY TIME:

Pull the most recent changes from github:

`git pull`

and then run the script!

`node index.js`

The resulting csv will be uploaded to `/html/national/2019/fec-campaign-data/data/`

## STYLE TWEAKS (NAMES, CANDIDACY STATUS)

#### Change the style of a name

Candidates' names who need to be changed from their format in the API are hard-coded in `intermediate/name-check.csv`.

Candidates' names are pulled from the API in all caps, in LAST NAME, FIRST NAME format. The script automatically converts them to title case, First Name Last Name format. There are cases, however, where this won't look right. For example, BIDEN, JOSEPH R JR will convert to Joseph R Jr Biden. For cases like this, you can manually update and style names how you like in `/intermediate/name-check.csv`. 

In the 'INPUT NAME' column, write the name as it appears parsed by the script. In the 'DESIRED STYLED NAME' column, write the name as you'd like it to appear. For example:

INPUT NAME | DESIRED STYLED NAME
--- | ---
Bernard Sanders | Bernie Sanders
Joseph R Jr Biden | Joe Biden
Robert Beto O'rourke | Beto O'Rourke

If you make a change to this csv, make sure to commit the change and push the change to github.

`git push`

#### Candidacy Status

The API includes a candidate's status, but it's possible that this may not be updated in the API's data before we need it to be reflected in the chart. To force a candidate's candidacy to reflect that they've dropped out, add the candidate's name to the "Dropped Out" column in `intermediate/dropped-out.csv`.

The candidate's name should be formatted exactly the same way it will be formatted in the final .csv / table on the site. This means that if the candidate is in the `intermediate/name-checks.csv` file, it should be the same text that is in the 'DESIRED STYLED NAME' column. 

Once you've added a candidate, remember to push the changes to github.

`git push`
