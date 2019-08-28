'use strict'
const fs = require('fs')
const request = require('request')
const d3 = Object.assign({}, require("d3-dsv"))
const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

let ftpDeployConfig = {
  user: process.env.FTPUSER,
  password: process.env.FTPPASS,
  host: process.env.FTPHOST,
  port: 21,
  localRoot: './tmp',
  remoteRoot: '/html/national/2019/fec-campaign-data/data/',
  // include: ['*', '**/*'],
  include: ['*'],
  exclude: ['dist/**/*.map'],
  deleteRemote: false
}

async function handler (){
  async function checkKeys(){
    return new Promise((resolve, reject) => {
      if (process.env.FTPUSER === undefined){
        console.log('FTPUSER is undefined. Please store your FTP username as an environment variable.')
        reject()
      } else if (process.env.FTPPASS === undefined){
        console.log('FTPPASS is undefined. Please store your FTP password as an environment variable.')
        reject()
      } else if (process.env.FTPHOST === undefined){
        console.log('FTPHOST is undefined. Please store your FTP host as an environment variable.')
      } else {
        resolve()
      }
    })
  }
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
    }

    let pageOne = await onePage(1)
    pageOne['results'].map(d => candidates.push(d))

    let pages = pageOne['pagination']['pages']

    for (let i = 2; i <= pages; i++){
      let currPage = await onePage(i)
      currPage['results'].map(d => candidates.push(d))
    }
    return candidates
  }

  async function writeData (data) {
    let csv = d3.csvFormat(data)
    await fs.writeFile('./tmp/receipts-by-candidate.csv', csv, (error) => {
      if (error) throw error
    })
  }

  async function transferToFTP(){
    return new Promise(
      function (resolve, reject) {
        ftpDeploy.deploy(ftpDeployConfig, function (error) {
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
  }

  await checkKeys()
  let data = await fetchData()
  await writeData(data)
  await transferToFTP()

  return {'statusCode':200, 'body':'{"status":"done"}'}
}
handler()