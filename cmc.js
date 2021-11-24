/**
 * This script is used to 
 * 1. monitor all new falling coins. 
 * -- set fallingCoin = true;
 * 2. fetch ALL coins in CMC and save to file. 
 * -- set loadAllCmcCoins = true to fetch data.
 * -- coins/tokens are saved to ./dbcmc/data.txt_[date_time] file.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const schedule = require('node-schedule');
const { Telegraf } = require('telegraf');
const bot = new Telegraf('2118136589:AAF8y223Y1-TufaZhg5k0-3-tCmAazkz224');
const botChatId = '-684583993';
const { r, log, logD, device, r15, r58 } = require('./src/helpers');
const sleep = require('sleep');
//DB
const level = require('level');
const db = level('dbCmc');

//Sound
const sound = require('sound-play');
const { url } = require('inspector');
const filePath = path.join(__dirname, 'dbcmc/data.txt');


const winston = require('winston');
const CntUtils = require('./src/CntUtils');

// const { CmcCoin } = require('./src/classes/CmcCoin'); 
const CmcUtil = require('./src/cmc/CmcUtil');
const { CmcCoin } = require('./src/classes/CmcCoin');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Demo' }),
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.label} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'logBnc.log'
        })
    ]
});


const fallingCoin = true;
const loadAllCmcCoins = false;

if(fallingCoin == true){
    console.log(`CMC falling coins monitoring`);
    let c = new CmcCoin();
    console.log(c);
    // let gl = await CmcUtil.cmcGainerLosers();
    // console.log(gl);
}

// console.log(CntUtils.parseBncArticle(`Binance Will List Rari Governance Token (RGT)`));
// exit(1);

// bot.telegram.sendMessage(botChatId, `BNC listing monitor started.`);

// Keep track of the status
let isBncRunning = false
let nowStr = new Date().toLocaleString().replace(/[^a-zA-Z0-9]/g, "_");

// console.log(fs.readJSONSync(filePath));
console.log(CntUtils.cmcFindCoinsByAddr('usdt', tokenAddr='0x55d398326f99059ff775485246999027b3197955'));
console.log(CntUtils.cmcFindCoins('usdt', website='https://tether.to'));

async function loadCMC(allC) {
    // let allC = fs.readJSONSync(filePath);
    let ids = '';
    let allFullC = [];
    for (let i = 0; i < allC.length; i++) {
        const element = allC[i];
        if (i % 100 == 99 || i == allC.length - 1) {
            ids += `${element.id}`

            sleep.sleep(3);
            let cc = await CntUtils.cmcMetadataIds(ids);
            for (const fci of cc) {
                allFullC.push(fci);
            }
            console.log(`loadCMC allFullC.length ${allFullC.length}`);
            ids = '';
        } else {
            ids += `${element.id},`
        }
    }
    let d = new Date().toLocaleString().replace(/[^a-zA-Z0-9]/g, "_");
    fs.outputJSONSync(filePath + d, allFullC);
    console.log('save data ok');
}
 
if (loadAllCmcCoins) {
    CntUtils.cmcListing(1, 5000).then(res => {
        // console.log(res);
        let allC = [];
        for (const c of res.data) {
            let myC = new CmcCoin(c)
            allC.push(myC);
        }
        console.log(`CntUtils.cmcListing allc lenth ${allC.length}`);
        CntUtils.cmcListing(5001, 5000).then(res => {
            for (const c of res.data) {
                let myC = new CmcCoin(c)
                allC.push(myC);
            }
            console.log(`CntUtils.cmcListing allc lenth ${allC.length}`);
            CntUtils.cmcListing(10001, 5000).then(res => {
                for (const c of res.data) {
                    let myC = new CmcCoin(c)
                    allC.push(myC);
                }
                console.log(`CntUtils.cmcListing allc lenth ${allC.length}`);
                // fs.outputJSONSync(filePath, allC);
                loadCMC(allC);
            });
        });

    });
}
// CntUtils.cmcListing(1, 5).then(console.log);
// CntUtils.cmcListing(6, 5).then(console.log);
// CntUtils.cmcListing(1, 10).then(console.log);

schedule.scheduleJob({ second: [50] }, async () => {
    console.log('CMC running...');
});
 