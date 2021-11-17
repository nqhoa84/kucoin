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
const db = level('dbCgc');

//Sound
const sound = require('sound-play');
const { url } = require('inspector');
const filePath = path.join(__dirname, 'dbCgc/data.txt');
const soundFilPath = path.join(__dirname, 'sound.mp3');


const winston = require('winston');
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Demo' }),
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.label} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'logNewAdded.log'
        })
    ]
});
const CntUtils = require('./src/CntUtils');
const { exit } = require('process');

const CoinGecko = require('./src/cgc/CoinGecko');
const cgc = new CoinGecko();

async function main(params) {
    console.log('Coingecko running');
    // console.log(await cgc.ping());
    // let allC = await cgc.coins.list();
    // console.log(allC.data);
    // let d = new Date().toLocaleString().replace(/[^a-zA-Z0-9]/g, "_");
    // let file = filePath + d;
    // fs.outputJSONSync(file, allC);
    // console.log(`save all: ${file}`);

    let cData = await cgc.coins.fetch('cointribe',
        { tickers: false, market_data: true, localization: false, developer_data: false });
    if (cData && cData.success == true) {
        cData = cData.data;
    } else { exit(1); }
    console.log(cData);
    // let website, bscContractAddr, teleAcc;
    // if(cData.links && cData.links.homepage && cData.links.homepage.length > 0){
    //     website = cData.links.homepage[0];
    // }

    // if(cData.links && cData.links.homepage && cData.links.homepage.length > 0){
    //     teleAcc = cData.links.telegram_channel_identifier;
    // }

    // if(cData.platforms) {
    //     bscContractAddr = cData.platforms['binance-smart-chain'];
    // }
    // console.log(`website ${website}`);
    // console.log(`contract ${bscContractAddr}`);
    // if(website) {
    //     open(website).catch();
    //     open(`https://www.coingecko.com/en/coins/${cData.id}`)
    // }
    // if(bscContractAddr){
    //     CntUtils.openPooBsc(bscContractAddr);
    // }
    // CntUtils.sendTele(`New add on CGC, https://www.coingecko.com/en/coins/${cData.id}`);
    // sound.play(soundFilPath);
}
main();


let isRunning = false;
let allCoins;
schedule.scheduleJob({ second: [22, 52] }, async () => {
    if (isRunning) {
        console.log('CGC running...');
        return;
    }
    isRunning = true;
    logger.info(`Searching for new added on CGC`);
    try {
        let res = await cgc.coins.list();
        let nowAllC;
        if (res && res.success == true) {
            nowAllC = res.data;
            // console.log(nowAllC);
        }
        if (!allCoins) {
            allCoins = nowAllC;
        } else {
            let newCoins = [];
            for (const c of nowAllC) {
                let exist = false;
                for (const oldC of allCoins) {
                    if (oldC.id == c.id) {
                        exist = true;
                        break;
                    }
                }
                if (exist == false) {
                    newCoins.push(c);
                }
            }
            allCoins = nowAllC;
            logger.info(`new coins added: ${newCoins.length}`);
            logger.info(JSON.stringify(newCoins));
            newCoins.forEach(nc => {
                let cData = await cgc.coins.fetch(nc.id,
                    {
                        tickers: true, market_data: true,
                        localization: false, developer_data: true
                    });
                // console.log(cData);
                logger.info('Find new added on CoGC');
                logger.info(JSON.stringify(cData));
                processNewAdded(cData);
            });
        }
    } catch (error) {
        console.error(error);
        logger.error(error);
    }
    logger.info(`Finish Searching for new added on CGC`);
    isRunning = false;
});


async function processNewAdded(cgcResponse) {
    if (cgcResponse && cgcResponse.success == true) {
        cgcResponse = cgcResponse.data;
    } else {
        CntUtils.sendTele(`query CGC data fail`);
        return;
    }
    let website, bscContractAddr, teleAcc;
    if (cgcResponse.links && cgcResponse.links.homepage && cgcResponse.links.homepage.length > 0) {
        website = cgcResponse.links.homepage[0];
    }

    if (cgcResponse.links && cgcResponse.links.homepage && cgcResponse.links.homepage.length > 0) {
        teleAcc = cgcResponse.links.telegram_channel_identifier;
    }

    if (cgcResponse.platforms) {
        bscContractAddr = cgcResponse.platforms['binance-smart-chain'];
    }
    console.log(`website ${website}`);
    console.log(`contract ${bscContractAddr}`);
    if (website) {
        open(website);
        open(`https://www.coingecko.com/en/coins/${cgcResponse.id}`)
    }
    if (bscContractAddr) {
        CntUtils.openPooBsc(bscContractAddr);
    }
    CntUtils.sendTele(`New add on CGC, https://www.coingecko.com/en/coins/${cgcResponse.id}`);
    sound.play(soundFilPath);
}