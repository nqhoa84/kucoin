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
const { exit } = require('process');
const { Coin } = require('./src/classes/Coin');

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

// console.log(CntUtils.parseBncArticle(`Binance Will List Rari Governance Token (RGT)`));
// exit(1);

// bot.telegram.sendMessage(botChatId, `BNC listing monitor started.`);

// Keep track of the status
let isBncRunning = false
let nowStr = new Date().toLocaleString().replace(/[^a-zA-Z0-9]/g, "_");

// console.log(fs.readJSONSync(filePath));
console.log(CntUtils.cmcFindCoinsByAddr('usdt', tokenAddr='0x55d398326f99059ff775485246999027b3197955'));
// CntUtils.cmcMetadata('USDC,USDT');
// exit(1);
if (false) {
    loadCMC();
}
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

if (false) {
    CntUtils.cmcListing(1, 5000).then(res => {
        // console.log(res);
        let allC = [];
        for (const c of res.data) {
            let myC = new Coin(c)
            allC.push(myC);
        }
        console.log(`CntUtils.cmcListing allc lenth ${allC.length}`);
        CntUtils.cmcListing(5001, 5000).then(res => {
            for (const c of res.data) {
                let myC = new Coin(c)
                allC.push(myC);
            }
            console.log(`CntUtils.cmcListing allc lenth ${allC.length}`);
            CntUtils.cmcListing(10001, 5000).then(res => {
                for (const c of res.data) {
                    let myC = new Coin(c)
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
    console.log('Bnc running...');
});

async function check4newArticleBnc() {
    console.log('Open Bnc on ' + new Date().toLocaleString());
    logger.info(`Open Bnc page`);

    const browser = await puppeteer.launch({ headless: true });
    logger.info(`Browser launched`);
    const page = await browser.newPage();
    logger.info(`Browser newpage launched`);
    await page.goto('https://www.binance.com/en/support/announcement/c-48?navId=48', {
        waitUntil: 'networkidle2'
    }).catch(() => {
        logger.error(`Browser newpage ERROR`);
        console.error(`Browser newpage ERROR`);
    });
    logger.info(`Voting launched`);

    await page.waitForXPath('//a[@class="css-1ej4hfo"]', {
        timeout: 10000,
        visible: true
    }).then(() => {
        console.log('Got it on ' + new Date().toLocaleString());
    }).catch(() => {
        console.log('No vote avaliable');
    });

    const items = await page.evaluate(() => {
        let items = document.querySelectorAll('a[class="css-1ej4hfo"]');
        let links = []
        for (let item of items) {
            links.push(`${item.getAttribute('href')}bncfuckfuckbnc${item.innerHTML}`);
        }
        return links;
    });

    logger.info(`Bnc, total links=${items.length}`);

    let played = false, openCmc = false;
    for (let item of items) {
        let prs = item.split(`bncfuckfuckbnc`);
        let url = 'https://www.binance.com' + prs[0], title = prs[1];
        console.log(url);
        console.log(title);
        // continue;
        try {
            await db.get(url);
        } catch {
            let { name, symbol } = CntUtils.parseBncArticle(title);
            if (name && name.length > 5 && symbol && symbol.length > 1) {
                logger.info(`Bnc new Listing: ${url}`);
                open(url);

                if (!played) {
                    sound.play(filePath);
                }
                played = true;

                logger.info(`${symbol} on Bnc ${url}`);
                bot.telegram.sendMessage(botChatId, `${symbol} on Bnc ${url}`);

                console.log(await (await openCMC(symbol)).platform);

                let data = await loadListingData(url);

                console.log('slug = ' + data.slug);
                console.log('title = ' + data.title);
                console.log('content = ' + data.content);

                await page.waitForTimeout(r58);
                exit(1);
            }



            // let { symbol, contractAddr } = CntUtils.parseBncArticle(data.title, data.content);
            // openPoo(contractAddr);

            // await openCMC(symbol);

            await db.put(url, true);
            // console.log('Data saved ' + url + ' on ' + new Date().toLocaleString());
            await page.waitForTimeout(r58);
        }
    }

    await browser.close();

    async function loadListingData(url) {
        await page.goto(url, {
            waitUntil: 'networkidle2'
        });

        await page.waitForXPath('//div[@class="css-1ybfxxc"]', {
            timeout: 10000,
            visible: true
        }).then(() => {
            console.log('Got content ' + url + ' on ' + new Date().toLocaleString());
        }).catch(() => {
            console.log('No content avaliable');
        });

        let data = await page.evaluate(() => {
            let slug = document.querySelector('div[class="css-1lfxnnc"]').querySelector('h1[class="css-kxziuu"]').textContent;
            let title = document.querySelector('div[class="css-1lfxnnc"]').querySelector('h1[class="css-kxziuu"]').outerHTML;
            let content = document.querySelector('div[class="css-1lfxnnc"]').querySelector('div[class="css-1ybfxxc"]').innerHTML;
            return {
                slug: slug,
                title: title,
                content: content
            };
        });
        return data;
    }

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
            return c;
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
