'use strict'
const fs = require('fs')
const request = require('request')
const d3 = Object.assign({}, require("d3-dsv"))
const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();
const csv = require("csvtojson")

async function handler (){

  async function checkKeys(){
    let config = {
      port: 21,
      localRoot: './tmp',
      remoteRoot: '/html/national/2019/fec-campaign-data/data/',
      include: ['*'],
      exclude: ['dist/**/*.map'],
      deleteRemote: false
    }
    return new Promise(async function(resolve, reject){
      if (process.env.FTPUSER === undefined){
        console.log('FTPUSER is undefined. Please store your FTP username as an environment variable.')
        reject()
      } else if (process.env.FTPPASS === undefined){
        console.log('FTPPASS is undefined. Please store your FTP password as an environment variable.')
        reject()
      } else if (process.env.FTPHOST === undefined){
        console.log('FTPHOST is undefined. Please store your FTP host as an environment variable.')
        reject()
      } else {
        config.user = process.env.FTPUSER
        config.password = process.env.FTPPASS
        config.host = process.env.FTPHOST
      }
      resolve(config)
    })
  } // checks that FTP environment variables are set

  async function fetchData(){
    let key = 'mocnR6a3eBqdophIJ4qYagFUSPezKonikDmz0d4p',
    year = '2020',
    officeID = 'P',
    limit = 20,
    min_receipts = 2000

    let candidates = []

    async function onePage (pageNo) {
      return new Promise((resolve, reject) => {
        request(
          'https://api.open.fec.gov/v1/candidates/totals/?api_key=' + key + 
          '&sort_nulls_last=false&office=' + officeID +
          '&election_full=true&min_receipts=' + min_receipts + 
          '&election_year=' + year + 
          '&page=' + pageNo + 
          '&per_page=' + limit + 
          '&sort_null_only=false&has_raised_funds=true&sort_hide_null=false',
          handleResponse
        )
        function handleResponse(error, response, body){
          if (error){
            throw error
            reject()
          } else {
            console.log('Successfully parsed page number ' + pageNo)
            resolve(JSON.parse(body))
          }
        }
      })
    } // makes a request for a specific page of data, resolves as parsed JSON

    let pageOne = await onePage(1) 
    pageOne['results'].map(d => candidates.push(d)) // requests the first page and push to array

    let pages = pageOne['pagination']['pages']

    for (let i = 2; i <= pages; i++){
      let currPage = await onePage(i)
      currPage['results'].map(d => candidates.push(d))
    } // iterates over 2nd and beyond pages of data and pushes each candidate to candidates array
    return candidates
  } // requests presidential candidate data
  async function parseData (data) {
    let nameSwap = await csv().fromFile('./intermediate/name-check.csv')
    let dropOuts = await csv().fromFile('./intermediate/dropped-out.csv')

    let parsedData = data.map(d => {
      let o = {}
      o['Total Raised'] = d['receipts']
      o['Candidate'] = d['name'].toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      o['Candidate'] = o['Candidate'].split(', ')[1] + ' ' + o['Candidate'].split(', ')[0]
      o['Party'] = d['party_full']
      o['candidate_status'] = d['candidate_status']
      return o
    })

    nameSwap.map(n => {
      let changedName = false
      parsedData.forEach(p => {
        if (p['Candidate'] === n['INPUT NAME']){
          p['Candidate'] = n['DESIRED STYLED NAME']
          changedName = true
        }
      })
      if (!changedName){
        console.log(`${n['INPUT NAME']} not found in data but was in your list of names to change. Try this one again.`)
      }
    })

    dropOuts.map(d => {
      let droppedOut = false
      parsedData.forEach(p => {
        if (p['Candidate'] === d['Dropped Out']){
          if (p['candidate_status'] !== 'P'){
            p['candidate_status'] = 'P'
          }
          droppedOut = true
        }
      })
      if (!droppedOut){
        console.log(`${n['INPUT NAME']} not found in data but was in your list of names of candidates who dropped out. Try this one again.`)
      }
    })
    return parsedData
  }
  async function writeData (data) {
    let csv = d3.csvFormat(data)
    await fs.writeFile('./tmp/receipts-by-candidate.csv', csv, (error) => {
      if (error) throw error
    })
  } // writes data to a csv, stores in ./tmp

  async function transferToFTP(config){
    return new Promise(
      function (resolve, reject) {
        ftpDeploy.deploy(config, function (error) {
          if (error) {
            console.log(error)
            reject(error)
          } else {
            console.log("Uploaded files to " +ftpDeployConfig['remoteRoot'])
            resolve()
          }
        })
      }
    )
  } // transfers all file(s) from ./tmp to data.nbcstations

  // executes async functions in order:
  let data = await fetchData()
  data = await parseData(data)
  await writeData(data)
  let ftpDeployConfig = await checkKeys()
  await transferToFTP(ftpDeployConfig)

  return {'statusCode':200, 'body':'{"status":"done"}'}
}
handler()