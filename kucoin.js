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
const db = level('db');
// const dbCMC = level('dbcmc'); 

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
			filename: 'log.log'
		})
	]
});


// Keep track of the status
let isKucoinrunning = false
const checkKucoin = true;
let isCoinbaseRunning = false
const checkCoinbase = false;



logger.info(`checkKucoin = ${checkKucoin}, checkCoinbase = ${checkCoinbase}`);


async function test(params) {
    // let res = await CntUtils.cmcListing();
    // res.data.forEach(element => {
    //     let c = new Coin(element);
    //     console.log(c.id);
    //     console.log(c);
    //     try {
    //         await db.get(c.id);    
    //     } catch (error) {
    //         await db.put(c.id, c);
    //     }
        
    // });

        // try {
        //     await db.get(123);    
        // } catch (error) {
        //     await db.put(123, {id:123, name:'teskltj'});
        // }
    let c = await CntUtils.cmcMetadata(symbol='BANANA');
    console.log(c.slug);
    console.log(c);
    exit(1);
}

//  test();

 

if(checkKucoin == true) {
    schedule.scheduleJob({second: [5,25,45]}, async () => { 
        if (isKucoinrunning) {
            console.log('Kucoin running...');
            logger.info(`Kucoin running ${isKucoinrunning}`);
        } else {
            isKucoinrunning = true;
            try {
                await check4newArticleKucoin();
            } catch (error) {
                console.error(error);
            }
            
            isKucoinrunning = false;
        }
    });
}


if(checkCoinbase == true) {
    schedule.scheduleJob({second: [10,30,50]}, async () => {
        if (isCoinbaseRunning) {
            console.log('V1.2 Coinbase running...');
        } else {
            isCoinbaseRunning = true;
            console.log('V1.2 Coinbase on ' + new Date().toLocaleString());
    
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto('https://blog.coinbase.com/', {
                waitUntil: 'networkidle2'
            });
    
            await page.waitForXPath('//div[@class="u-lineHeightBase postItem"]', {
            // await page.waitForXPath('//a[@data-action="open-post"]', {
                timeout: 10000,
                visible: true
            }).then(() => {
                console.log('Got it on ' + new Date().toLocaleString());
            }).catch((e) => {
                console.log(e);
                console.log('No vote avaliable');
            })
    
            const items = await page.evaluate(() => { 
                let items = document.querySelectorAll('a[class="open-post"]'); 
                let links = [] 
                for (let item of items) {
                    links.push(item.getAttribute('href')); 
                }
                return links;
            });
            
            let played = false;
            for (let item of items) {
                console.log(item);
            //     let link = parseKucoinLink(item)
            //     try {
            //         await db.get(link);
            //     } catch {
            //         if (!played) {
            //             sound.play(filePath);
            //         }
            //         played = true;
            //         let url = 'https://www.kucoin.com/news/en-' + link;
    
                     
                    
            //         console.log(`Open ${url} at ` + new Date().toLocaleString());
            //         open(url)
            //         db.put(link, true);

            //         await page.waitForTimeout(r58);
            //     }
    
            }
    
            await browser.close();
            isCoinbaseRunning = false;
        }
    });
}

async function check4newArticleKucoin() {
    console.log('Open Kucoin on ' + new Date().toLocaleString());
    logger.info(`Open Kucoin page`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.kucoin.com/news/categories/listing', {
        waitUntil: 'networkidle2'
    });

    await page.waitForXPath('//div[@class="mainTitle___mbpq1"]', {
        timeout: 10000,
        visible: true
    }).then(() => {
        console.log('Got it on ' + new Date().toLocaleString());
    }).catch(() => {
        console.log('No vote avaliable');
    });

    const items = await page.evaluate(() => {
        // console.log('xxxxxxxxxxxxxxx');
        let items = document.querySelectorAll('div[class="mainTitle___mbpq1"]');
        // return items;
        let links = [];
        let i = 0;
        for (let item of items) {
            // links.push(item.getAttribute('href'));
            // console.log(`xxxxxxxxxxxxxxx ${i}`);
            links.push(item.innerHTML);
        }
        // links.push(`<a>Ispolink Gets Listed on KuCoin! </a><p>Trading: 10:00 on November 05, 2021 (UTC)</p>`);
        return links;
    });

    logger.info(`Kucoin, total links=${items.length}`);

    let played = false, openCmc = false;
    for (let item of items) {
        // logger.info(item);
        let { link, ticker } = CntUtils.parseKucoinLink(item);
        try {
            await db.get(link);
            // if(played == false) {
            //     console.log(`value ${a.b.c}`);
            //     let a = 3/0;
            // }
        } catch {
            let url = 'https://www.kucoin.com/news/en-' + link;
            logger.info(`Kucoin new article: ${url}`);
            open(url);

            if (!played) {
                sound.play(filePath);
            }
            played = true;
            
            bot.telegram.sendMessage(botChatId, `${ticker} on kucoin ${url}`);

            if (!openCmc) {
                let c = await CntUtils.cmcMetadata(symbol = ticker);
                logger.info(`found coin ${ticker} on cmc, slug= ${c?c.slug : 'no slug'}`);
                if(c && c.slug) {
                    open(`https://coinmarketcap.com/currencies/${c.slug}`);
                } else {
                    open(`https://coinmarketcap.com/`);
                }
                
                openCmc = true;
            }

            //todo find the token on cmc and open accurate page. 
            await db.put(link, true);
            // console.log('Data saved on ' + new Date().toLocaleString());
            await page.waitForTimeout(r58);
        }

    }

    await browser.close();
}

async function getKucoinListingInfo(page, url) {
    await page.goto(url, {
        waitUntil: 'networkidle2'
    });

    await page.waitForXPath('//div[@class="css-1ybfxxc"]', {
        timeout: 10000,
        visible: true
    }).then(() => {
        console.log('Got content on ' + new Date().toLocaleString());
    }).catch(() => {
        console.log('No content avaliable');
    })

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

    let slug = data.slug;

    let title = data.title;

    let content = data.content;
}