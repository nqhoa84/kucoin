/**
 * This script is used to 
 * 1. monitor all new falling coins. 
 * -- set fallingCoin = true;
 * 2. fetch ALL coins in CMC and save to file. 
 * -- set loadAllCmcCoins = true to fetch data.
 * -- coins/tokens are saved to ./dbcmc/data.txt_[date_time] file.
 */

const fallingCoin = true;
const thres1H = -10
const chains = [`bsc`]
const loadAllCmcCoins = false;

const schedule = require('node-schedule');
const winston = require('winston');
const CmcUtil = require('./src/cmc/CmcUtil');
const CntUtils = require('./src/CntUtils');
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'Demo' }),
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.label} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'logCMC.log'
        })
    ]
});

let currFallCoins = [];
CntUtils.consoleLogWithTime(`Started`, logger);
CntUtils.sendTele(`Start bắt dao rơi, thres1H = ${thres1H}%, chains = ${chains}`);

async function main(params) {
    CntUtils.consoleLogWithTime(`CMC falling coins monitoring`); 
    if (fallingCoin == true) {
        try {
            let gl = await CmcUtil.cmcGainerLosers();
            let newFallings = [];
            for (const c of gl) {
                if(c.quote.USD.percent_change_1h <= thres1H) {
                    //check for chains
                    let chainOK = false;
                    for (const chain of chains) {
                        if(chain == 'all'
                            || (chain == 'bsc' && c.platform && c.platform.id == 1839)
                            || (chain == 'eth' && c.platform && c.platform.id == 1027)
                        ) {
                            chainOK = true; 
                            break;
                        }
                    }
                    if(chainOK == true) {
                        newFallings.push(c);
                    }
                }
            }

            logIds(newFallings, 'current {-10%,1h} coins')

            if(currFallCoins.length == 0) {
                currFallCoins = newFallings;
            } else {
                for (const c of newFallings) {
                    let exist = false;
                    for (const curC of currFallCoins) {
                        if(c.id == curC.id) {
                            exist = true;
                            break;
                        }
                    }
                    if(exist == false) {
                        CntUtils.consoleLogWithTime(`Falling found: ${c.slug} 1h -${c.quote.USD.percent_change_1h}%`);
                        CntUtils.sendTele(`new drop ${c.name}-${c.symbol}: 1h -${c.quote.USD.percent_change_1h}% 24h -${c.quote.USD.percent_change_24h}% 
                        https://coinmarketcap.com/currencies/${c.slug}
                        `);
                    }
                }
                currFallCoins = newFallings;
            } 
            // console.log(gl);
        } catch (error) {
            console.error(error);
        }
    
    }    
}

async function test(params) {
    currFallCoins = await CmcUtil.cmcGainerLosers();
    console.log(currFallCoins);
    // for (const c of currFallCoins) {
    //     if(c.quote.USD.percent_change_1h < -10) {
    //         console.log(`${c.id} fall MORE than 10% in 1hour: [${c.quote.USD.percent_change_1h}]`);
    //         // console.log(c);
    //     } else {
    //         console.log(`${c.id} fall LESS than 10% in 1hour [${c.quote.USD.percent_change_1h}]`);
    //     }
    // }

    logIds(currFallCoins, 'curr fall coins');
}
test();

function logIds(coinList, msg) {
    let re = [];
    for (const c of coinList) {
        re.push(c.id);
    }
    logger.info(`${msg}: ${JSON.stringify(re)}`);
}
// main();

if(fallingCoin) {
    let isRunning = false;
    schedule.scheduleJob({ minute: [1, 11, 21, 31, 41, 51] }, async () => {
        // console.log('Check for new falling');
        if(isRunning == true) {
            CntUtils.consoleLogWithTime('CMC running...', logger);
        } else {
            CntUtils.consoleLogWithTime('Check for new falling', logger);
            isRunning = true;
            try {
                main().catch((reason) =>{
                    console.log(reason);
                    isRunning = false;
                });
            } catch (error) {
                console.error(error);
            }
            isRunning = false;
        }
        
    });
}

