const puppeteer = require('puppeteer');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const schedule = require('node-schedule');
const { r, log, logD, device, r58 } = require('./src/helpers');

//Sound
const sound = require('sound-play');
const filePath = path.join(__dirname, 'sound.mp3');


const winston = require('winston');
const CntUtils = require('./src/CntUtils');
const { sleep } = require('sleep');
const { exit } = require('process');
const StrUtils = require('./src/StrUtils');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Demo' }),
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.label} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'logcake.log'
        })
    ]
});

// CntUtils.sendTele(`start 12345`);

// Keep track of the status
let isCakeRunning = false;
console.log(__dirname);
// CntUtils.consoleLogWithTime(StrUtils.removeAllSpecial(`0x477bc8d23c634c154061869478bce96be6045d12,`));

schedule.scheduleJob({ second: [0, 20, 40] }, async () => {
    if (isCakeRunning === true) {
        CntUtils.consoleLogWithTime(`Cake running = ${isCakeRunning}`); 
    } else {
        isCakeRunning = true;
        CntUtils.consoleLogWithTime(`V1.3 Cake vote checking.`); 
        try {
            await check4newArticleCake();
        } catch (error) {
            console.error(error);
            logger.error(error);

            sleep(60);
        }

        isCakeRunning = false;
    }
});
let allVote = [];
let isPlayed = false;
async function check4newArticleCake() {
    CntUtils.consoleLogWithTime(`Open Cake page`, logger);

    const browser = await puppeteer.launch({ headless: true });
    logger.info(`Browser launched`);
    const page = await browser.newPage();
    logger.info(`Browser newpage launched`);
    await page.goto('https://pancakeswap.finance/voting', {
        waitUntil: 'networkidle0'
    });
    logger.info(`Voting launched`);
    // let fullCnt = await page.content();
    // fs.outputFileSync(path.join(__dirname, 'voting.txt'), fullCnt);
    // console.log(`--------save full data--------`)
    //sc-dVSYCO euLBqB
    await page.waitForXPath('//a', {
        timeout: 20000,
        visible: true
    }).then(() => {
        CntUtils.consoleLogWithTime('Got some a element', logger);
    }).catch((reason) => {
        console.log(reason);
        console.log('No vote avaliable');
    });

    const items = await page.evaluate(() => {
        let items = document.querySelectorAll('a');
        let links = [];
        for (let item of items) {
            let link = `${item.getAttribute('href')}`;
            let l_lwc = link.toLowerCase(); //
            if (l_lwc.indexOf(`voting/proposal`) >= 0 || l_lwc.indexOf(`voting\proposal`) >=0) {
                links.push(link);
            }
        }
        return links;
    });

    CntUtils.consoleLogWithTime(`cake, items count =${items.length} allvote[${allVote}]`, logger);
    // CntUtils.consoleLogWithTime(`cake, total links=${items.length} allvote[${allVote}]`, logger);
    if (allVote.length == 0) {
        allVote = items;
    } else {
        if (isPlayed == false) {
            isPlayed = true;
            items.push(`/voting/proposal/QmWeGfp5DYF4ByHaryf9yxL6WPFU5CZHWo9epYqEzX3pBH`);
        }
        for (let link of items) {
            // if(link.startsWith(`/voting/proposal/cr`)) {
            //     continue;
            // }
            // CntUtils.consoleLogWithTime(link, logger);
            if (CntUtils.isListContainItem(allVote, link) == false) {
                allVote.push(link);
                let url = 'https://pancakeswap.finance' + link;
                logger.info(`Cake new article: ${url}`);
                open(url).catch((reason) => {
                    CntUtils.consoleLogWithTime(reason, logger);
                });
                sound.play(filePath).catch(() => { });
                CntUtils.sendTele(`{new vote} on Cake ${url}`, logger);

                await page.goto(url, {
                    waitUntil: 'networkidle0'
                });

                let fullArticle = await page.content().catch((reason)=>{
                    CntUtils.consoleLogWithTime(`Error ${reason}`, logger);    
                });
                CntUtils.consoleLogWithTime(`Full content loaded`);
                let { symbol, contractAddr } = CntUtils.parseCakeFullArticle(fullArticle);

                // await page.waitForXPath('//body', {
                //     timeout: 10000,
                //     visible: true
                // }).then(() => {
                //    CntUtils.consoleLogWithTime('Got content ' + url, logger);
                // }).catch((reason) => {
                //     CntUtils.consoleLogWithTime(`No content avaliable ${reason}`);
                // });

                // let data = await page.evaluate(() => { 
                //     let slug = document.querySelector('body').querySelector('h1[class="sc-gtsrHT sc-kLojOw emWolE hwBXuG"]').textContent;
                //     let title = document.querySelector('div[class="sc-jSFjdj gSuCSO"]').querySelector('h1[class="sc-gtsrHT sc-kLojOw emWolE hwBXuG"]').outerHTML;
                //     let content = document.querySelector('div[class="sc-jSFjdj gSuCSO"]').querySelector('div[class="sc-jSFjdj kJmatq"]').innerHTML;
                //     return {
                //         slug: slug,
                //         title: title,
                //         content: content
                //     };
                // });

                // let { symbol, contractAddr } = CntUtils.parseCakeTitle(data.title, data.content);
                CntUtils.consoleLogWithTime(`symbol: ${symbol} contract: ${contractAddr}`);
                openPoo(contractAddr);

                CntUtils.sendTele(symbol);
                CntUtils.sendTele(contractAddr);

                await openCMC(symbol, contractAddr);

                // console.log('Data saved ' + url + ' on ' + new Date().toLocaleString());
                await page.waitForTimeout(r58);
            }
        }
        // allVote = items;
    }

    await browser.close();

    /**
     * 
     * @param {string} symbol 
     * @param {string} address many addresses separated by comma ','
     */
    async function openCMC(symbol, address) {
        let coins = CntUtils.cmcFindCoins(symbol);
        if (coins.length == 0) {
            coins = CntUtils.cmcFindCoinsByAddr(address);
        }
        let isOpened = false;
        coins.forEach(c => {
            console.log(c);
            logger.info(`found coin ${symbol} on cmc, slug= ${c ? c.slug : 'no slug'}`);
            if (c && c.slug) {
                open(`https://coinmarketcap.com/currencies/${c.slug}`);
            } else {
                open(`https://coinmarketcap.com/`);
            }
            isOpened = true;
        });
        if (isOpened == false) {
            console.log(`can not find coin symbol ${symbol}, addr ${address}`);
            open(`https://coinmarketcap.com/`);
        }
    }

    async function openCMCbyAddr(address) { 
        let coins = CntUtils.cmcFindCoinsByAddr(address); 
        let isOpened = false;
        coins.forEach(c => {
            console.log(c);
            logger.info(`found coin ${symbol} on cmc, slug= ${c ? c.slug : 'no slug'}`);
            if (c && c.slug) {
                open(`https://coinmarketcap.com/currencies/${c.slug}`);
            } else {
                open(`https://coinmarketcap.com/`);
            }
            isOpened = true;
        });
        if (isOpened == false) {
            console.log(`can not find coin symbol ${symbol}, addr ${address}`);
            open(`https://coinmarketcap.com/`);
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
