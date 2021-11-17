const puppeteer = require('puppeteer');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const schedule = require('node-schedule');

const { r, log, logD, device, r15, r58 } = require('./src/helpers');
const sleep = require('sleep');

//Sound
const sound = require('sound-play');
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
const cgClient = new CoinGecko();

async function main(params) {
    CntUtils.consoleLogWithTime(`new added coin monitoring.`);
    let nc = await CntUtils.cmcMetadataBySlug('plateau-finance');
    console.log(nc);
}
main();


let isCgRunning = true;
let allCoins;
schedule.scheduleJob({ second: [52] }, async () => {
    if (isCgRunning) {
        CntUtils.consoleLogWithTime('CGC running...');
        return;
    }
    isCgRunning = true;
    logger.info(`Searching for new added on CGC`);
    try {
        let res = await cgClient.coins.list();
        let nowAllC;
        if (res && res.success == true) {
            nowAllC = res.data;
            CntUtils.consoleLogWithTime(`All coins size = ${nowAllC.length}`);
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
            for (const nc of newCoins) {
                let cData = await cgClient.coins.fetch(nc.id,
                    {
                        tickers: true, market_data: true,
                        localization: false, developer_data: true
                    });
                // console.log(cData);
                logger.info('Find new added on CoGC');
                logger.info(JSON.stringify(cData));
                processNewAdded(cData);
            }
            // newCoins.forEach(nc => {

            // });
        }
    } catch (error) {
        console.error(error);
        logger.error(error);
    }
    logger.info(`Finish Searching for new added on CGC`);
    isCgRunning = false;
});


async function processNewAdded(cgResponse) {
    if (cgResponse && cgResponse.success == true) {
        cgResponse = cgResponse.data;
    } else {
        CntUtils.sendTele(`query CGC data fail`);
        return;
    }
    let website, bscContractAddr, teleAcc;
    if (cgResponse.links && cgResponse.links.homepage && cgResponse.links.homepage.length > 0) {
        website = cgResponse.links.homepage[0];
    }

    if (cgResponse.links && cgResponse.links.homepage && cgResponse.links.homepage.length > 0) {
        teleAcc = cgResponse.links.telegram_channel_identifier;
    }

    if (cgResponse.platforms) {
        bscContractAddr = cgResponse.platforms['binance-smart-chain'];
    }
    console.log(`website ${website}`);
    console.log(`contract ${bscContractAddr}`);
    if (teleAcc) {
        open(`https://t.me/${teleAcc}`);
    }
    if (website) {
        open(website);
        open(`https://www.coingecko.com/en/coins/${cgResponse.id}`)
    }
    if (bscContractAddr) {
        CntUtils.openPooBsc(bscContractAddr);
    }

    CntUtils.sendTele(`New add on CGC, https://www.coingecko.com/en/coins/${cgResponse.id}`);
    sound.play(soundFilPath);
}



// Keep track of the status
let isCmcRunning = false

schedule.scheduleJob({ second: [27, 57] }, async () => {
    if (isCmcRunning) {
        CntUtils.consoleLogWithTime(`CMC new added running ${isCmcRunning}`);
        logger.info(`CMC new added running ${isCmcRunning}`);
    } else {
        isCmcRunning = true;
        try {
            await check4newAddedCmc();

        } catch (error) {
            logger.error(error);

            sleep.sleep(60);
        }

        isCmcRunning = false;
    }
});

let allNewAddedCmc = [];
async function check4newAddedCmc() {
    CntUtils.consoleLogWithTime(`Open CMC new added page`, logger);

    const browser = await puppeteer.launch({ headless: true });
    logger.info(`Browser launched`);
    const page = await browser.newPage();
    logger.info(`Browser newpage launched`);
    await page.goto('https://coinmarketcap.com/new/', {
        waitUntil: 'networkidle2'
    });
    logger.info(`CMC new added launched`);

    let isErr = false;
    await page.waitForXPath('//a[@class="cmc-link"]', {
        timeout: 10000,
        visible: true
    }).then(() => {
        CntUtils.consoleLogWithTime(`class = cmc-link OK`);
    }).catch((reason) => {
        isErr = true;
        console.log(reason);
        logger.error(reason);
        CntUtils.sendTele(`Cannot get CMC new added.`);
    });
    if (isErr == true) {
        return;
    }

    const items = await page.evaluate(() => {
        let items = document.querySelectorAll('a[class="cmc-link"]');
        let links = [];
        for (let item of items) {
            let l = item.getAttribute('href').toLocaleLowerCase();
            if (l.startsWith(`/currencies/`)) {
                let symbol = ''; 
                let inner = item.innerHTML.toLowerCase();
                let start = inner.indexOf(`sc-1eb5slv-0 ggipik coin-item-symbol`);
                if(start > 0) {
                    let str2end = inner.substring(start);
                    symbol = str2end;
                    start = str2end.indexOf(`>`);
                    let end = str2end.indexOf(`</p>`);
                    if(end > start + 2) {
                        symbol = str2end.substring(start + 1, end);
                    }
                } else {
                    symbol = inner;
                }

                links.push(item.getAttribute('href') + ',zzz,' + symbol);
            }
        }
        return links;
    });

    logger.info(`CMC new added, total links=${items.length}`);

    if (allNewAddedCmc.length == 0 && false) {
        for (const link of items) {
            allNewAddedCmc.push(link);
        }
    } else {
        let played = false, openCmc = false, teleSent = false;
        for (let it of items) {
            // console.log(it);
            // continue;
            if(CntUtils.isListContainItem(allNewAddedCmc, it) == false && played == false) {
                played = true;
                let strs = it.split(`,zzz,`);
                let link = strs[0];
                let slug = link.split(`/`)[2];
                let symbol = strs[1];
                let url = `https://coinmarketcap.com${link}`;
                CntUtils.consoleLogWithTime(`link ${link} slug ${slug} symbol ${symbol} url ${url}`);
                let nc = await CntUtils.cmcMetadataBySlug(slug);
                // console.log(nc);
                if(nc){
                    console.log('--------------' + nc.getBscTokenAddress2());
                    // CntUtils.openPooBsc(nc.getBscTokenAddress());
                    let teleLikn = nc.getTelegroupUrl2();
                    console.log('asdfasdfdsf' + teleLikn);
                    open(teleLikn);
                } else {
                    console.log('asdfasdfdsf');
                    console.log(nc);
                }
                console.log('asdfasdfdsf' + url);
                open(url); //open cmc link
                // break;
            } 
        }

    }


    await browser.close(); 

    async function openCMC(symbol) {
        if (!openCmc) {
            let c = await CntUtils.cmcMetadata(symbol = symbol);
            logger.info(`found coin ${symbol} on cmc, slug= ${c ? c.slug : 'no slug'}`);
            if (c && c.slug) {
                open(`https://coinmarketcap.com/currencies/${c.slug}`);
            } else {
                open(`https://coinmarketcap.com/`);
            }

            openCmc = true;
        }
    }

    function openPoo(contractAddr) {
        try {
            let ads = contractAddr.split(",");
            ads.forEach(element => {
                if (element.length >= 40) {
                    open(`https://poocoin.app/tokens/${element}`);
                    open(`https://pancakeswap.finance/swap?outputCurrency=${element}`);
                    open(`https://app.1inch.io/#/56/swap/BNB/${element}`);
                }
            });
        } catch (error) {
            logger.error(error);
            console.error(error);
        }
    }
}