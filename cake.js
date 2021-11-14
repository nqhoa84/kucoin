const puppeteer = require('puppeteer');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const schedule = require('node-schedule');
const { Telegraf } = require('telegraf');
const bot = new Telegraf('2118136589:AAF8y223Y1-TufaZhg5k0-3-tCmAazkz224');
const botChatId = '-684583993';
const { r, log, logD, device, r58 } = require('./src/helpers');

//DB
const level = require('level');
const db = level('dbcake');

//Sound
const sound = require('sound-play');
const { url } = require('inspector');
const filePath = path.join(__dirname, 'sound.mp3');


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
            filename: 'logcake.log'
        })
    ]
});

// Keep track of the status
let isCakeRunning = false

schedule.scheduleJob({ second: [0, 20, 40] }, async () => {
    if (isCakeRunning) {
        console.log('Cake running...');
        logger.info(`Cake running ${isCakeRunning}`);
    } else {
        isCakeRunning = true;
        console.log('V1.2 CAKE on ' + new Date().toLocaleString());

        await check4newArticleCake();
        isCakeRunning = false;
    }
});

async function check4newArticleCake() {
    console.log('Open Cake on ' + new Date().toLocaleString());
    logger.info(`Open Cake page`);

    const browser = await puppeteer.launch({ headless: true });
    logger.info(`Browser launched`);
    const page = await browser.newPage();
    logger.info(`Browser newpage launched`);
    await page.goto('https://pancakeswap.finance/voting', {
        waitUntil: 'networkidle2'
    }).catch(()=>{
        logger.error(`Browser newpage ERROR`);
        console.error(`Browser newpage ERROR`);
    });
    logger.info(`Voting launched`);

    await page.waitForXPath('//a[@class="sc-cKhgmI faEXBW"]', {
        timeout: 10000,
        visible: true
    }).then(() => {
        console.log('Got it on ' + new Date().toLocaleString());
    }).catch(() => {
        console.log('No vote avaliable');
    });

    const items = await page.evaluate(() => {
        let items = document.querySelectorAll('a[class="sc-cKhgmI faEXBW"]');
        let links = [];
        for (let item of items) {
            links.push(item.getAttribute('href'));
        }
        return links;
    });

    logger.info(`cake, total links=${items.length}`);

    let played = false, openCmc = false;
    for (let link of items) {
        try {
            await db.get(link);
        } catch {
            let url = 'https://pancakeswap.finance' + link;
            logger.info(`Cake new article: ${url}`);
            open(url);

            if (!played) {
                sound.play(filePath);
            }
            played = true;

            logger.info(`{new vote} on Cake ${url}`);
            bot.telegram.sendMessage(botChatId, `{new vote} on Cake ${url}`);

            await page.goto(url, {
                waitUntil: 'networkidle2'
            });

            await page.waitForXPath('//div[@class="sc-jSFjdj gSuCSO"]/div[@class="sc-jSFjdj kJmatq"]', {
                timeout: 10000,
                visible: true
            }).then(() => {
                console.log('Got content ' + url + ' on ' + new Date().toLocaleString());
            }).catch(() => {
                console.log('No content avaliable');
            });

            let data = await page.evaluate(() => {
                let slug = document.querySelector('div[class="sc-jSFjdj gSuCSO"]').querySelector('h1[class="sc-gtsrHT sc-kLojOw emWolE hwBXuG"]').textContent;
                let title = document.querySelector('div[class="sc-jSFjdj gSuCSO"]').querySelector('h1[class="sc-gtsrHT sc-kLojOw emWolE hwBXuG"]').outerHTML;
                let content = document.querySelector('div[class="sc-jSFjdj gSuCSO"]').querySelector('div[class="sc-jSFjdj kJmatq"]').innerHTML;
                return {
                    slug: slug,
                    title: title,
                    content: content
                };
            });

            let slug = data.slug;
            console.log(`slug`);
            console.log(slug);

            let title = data.title;
            console.log('title');
            console.log(title);

            let content = data.content;
            console.log('content');
            console.log(content);

            let { symbol, contractAddr } = CntUtils.parseCakeTitle(data.title, data.content);
            openPoo(contractAddr);

            await openCMC(symbol); 
            
            await db.put(link, true);
            // console.log('Data saved ' + url + ' on ' + new Date().toLocaleString());
            await page.waitForTimeout(r58);
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
