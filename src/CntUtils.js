const rp = require('request-promise');
const { CmcCoin, Platform } = require('./classes/CmcCoin');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const cmcDataPath = path.join(__dirname, '../dbcmc/data.txt');
const allCoinCmc = fs.readJSONSync(cmcDataPath);
const { Telegraf } = require('telegraf'); 
const teleObj = require('../cfg/tele')
const bot = new Telegraf(teleObj.teleBotToken);
const botChatId = teleObj.teleBotChatId;
//Test
// const botChatId = '-759160679';
//*/
/**
 * Parse kucoin article header and return {link, token's ticker}
 * @param {string} innerHtml 
 * @returns 
 */
function parseKucoinLink(innerHtml) {
	//let text = "<a>Streamr (DATA) Gets Listed on KuCoin! </a><p>Trading: 10:00 on November 4, 2021 (UTC)</p>";
	let link = '', ticker = '';
	try {
		const myArray = innerHtml.trim().split("<");
		const value = myArray[1].split(">");
		const title = value[1];
		link = title.trim().replace(/[^a-zA-Z ]/g, "").replace(/ /g, '-').toLowerCase();
	} catch (error) {
		console.error(error);
	}

	try {
		ticker = innerHtml.split('(')[1].split(')')[0].toUpperCase();
	} catch (error) {
		console.error(error);
	}
	return { link, ticker };
}
//*/ 

const cmcApiKey = `fdd2339e-1241-4b84-8cdf-be2c13881484`;

function cmcListing(start, limit) {
	const requestOptions = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
		qs: {
			'start': `${start}`,
			'limit': `${limit}`,
			'convert': 'USD'
		},
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};

	return rp(requestOptions);
}

/**
 * string: Alternatively pass one or more comma-separated cryptocurrency symbols. 
 * Example: "BTC,ETH". At least one "id" or "slug" or "symbol" is required for this request.
 * @param {string} symbol Must be uppercase
 * @param {string} contractAddr 
 */
async function cmcMetadata(symbol, contractAddr) {
	let qs;
	if (symbol) {
		qs = {
			'symbol': symbol
		};
	} else if (contractAddr) {
		qs = {
			'address': contractAddr
		};
	}
	const requestOptions = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
		qs: qs,
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};

	let res = await rp(requestOptions);
	if (res && res.data) {
		// console.log(res);
		return new CmcCoin(res.data[symbol]);
	}
}





module.exports = { parseKucoinLink, cmcListing, cmcMetadata };

/**
 * Parse cake title to get coin symbol and contract address.
 * @param {string} title 
 * @param {string} content 
 */
module.exports.parseCakeTitle = function parseCakeTitle(title, content) {
	let symbol = '';
	let contractAddr = '';
	let start = title.indexOf('(');
	let end = title.indexOf(')');
	if (start > 0 && end > start) {
		symbol = title.substring(start + 1, end).trim();
	} else {
		let t2 = title.toUpperCase();
		end = t2.indexOf('-BNB');
		if (end <= 0) {
			end = t2.indexOf('-BUSD');
		}
		if (end > 0) {
			start = t2.substring(0, end).lastIndexOf(' ');
		}
		if (start > 0 && end > start) {
			symbol = title.substring(start, end).trim();
		}
	}

	let cnt = content.toUpperCase();
	start = cnt.lastIndexOf('FOOD POISONING');
	if (start > 0) {
		cnt = content.substring(start).toLowerCase();
		let strs = cnt.split('bscscan.com/token/');
		strs.forEach(e => {
			if(e.startsWith('0x')) {
				let addr = e.substring(0, 42); 
				if (contractAddr.indexOf(addr) < 0) {
					contractAddr += `${addr},`
				}
			}
		}); 
	}

	if (contractAddr == '') {
		let strs = content.toLowerCase().split('bscscan.com/token/');
		strs.forEach(e => {
			if(e.startsWith('0x')) {
				let addr = e.substring(0, 42); 
				if (contractAddr.indexOf(addr) < 0) {
					contractAddr += `${addr},`
				}
			}
		}); 
	} else {
		console.log('can not find contract address.');
	}

	return { symbol, contractAddr }
}

/**
 * Parse cake vote content to get coin symbol and contract address.
 * @param {string} full Full vote content in html code. 
 */
 module.exports.parseCakeFullArticle = function parseCakeFullArticle(full) {
	let bdStart = full.indexOf(`<body`);
	let bdEnd = full.indexOf(`</body`);
	if(bdStart > 0 && bdEnd > bdStart) {
		full = full.substring(bdStart, bdEnd);
	}
	
	let symbol = '';
	let contractAddr = '';
	// let full = full;
	let start = full.indexOf('(');
	let end = full.indexOf(')');
	if (start > 0 && end > start) {
		symbol = full.substring(start + 1, end).trim();
	} else {
		let t2 = full.toUpperCase();
		end = t2.indexOf('-BNB');
		if (end <= 0) {
			end = t2.indexOf('-BUSD');
		}
		if (end > 0) {
			start = t2.substring(0, end).lastIndexOf(' ');
		}
		if (start > 0 && end > start) {
			symbol = full.substring(start, end).trim();
		}
	}

	
	let cnt = full.toUpperCase();
	start = cnt.lastIndexOf('FOOD POISONING');
	if (start > 0) {
		cnt = full.substring(start).toLowerCase();
		let strs = cnt.split('bscscan.com/token/');
		strs.forEach(e => {
			if(e.startsWith('0x')) {
				let addr = e.substring(0, 42); 
				if (contractAddr.indexOf(addr) < 0) {
					contractAddr += `${addr},`
				}
			}
		}); 
	}

	if (contractAddr == '') {
		let strs = full.toLowerCase().split('bscscan.com/token/');
		strs.forEach(e => {
			if(e.startsWith('0x')) {
				let addr = e.substring(0, 42); 
				if (contractAddr.indexOf(addr) < 0) {
					contractAddr += `${addr},`
				}
			}
		}); 
	} else {
		this.consoleLogWithTime('can not find contract address.');
	}

	return { symbol, contractAddr };
}

/**
 * Parse Binance title to get coin symbol and contract address.
 * @param {string} title 
 */
module.exports.parseBncArticle = function parseBncArticle(title) {
	let symbol = '';
	let name = '';
	let start = title.indexOf('(');
	let end = title.indexOf(')');
	if (start > 0 && end > start) {
		symbol = title.substring(start + 1, end).trim();
	}

	let cnt = title.trim().toLowerCase();
	for (let i = 0; i < 4; i++) {
		cnt.replace('  ', ' ');
	}

	console.log(cnt);
	start = cnt.indexOf('binance will list');
	end = cnt.indexOf('(');
	if (start >= 0 && end > start + 3) {
		name = cnt.substring(start + 18, end - 1);
	}
	return { symbol, name }
}

/**
 * string: Alternatively pass one or more comma-separated cryptocurrency symbols. 
 * Example: "BTC,ETH". At least one "id" or "slug" or "symbol" is required for this request.
 * @param {string} ids, separated by comma ","  
 */
module.exports.cmcMetadataIds = async function cmcMetadataIds(ids) {
	let qs = {
		'id': ids
	};
	const requestOptions22 = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
		qs: qs,
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};
	let res = await rp(requestOptions22);
	let re = [];
	if (res && res.data) {
		let idList = ids.split(",");
		for (const id of idList) {
			re.push(new CmcCoin(res.data[`${id}`]));
		}
	}
	return re;
}

/**
 * 
 * @param {string} slug Must be lowercase 
 * @returns 
 */
module.exports.cmcMetadataBySlug = async function cmcMetadataBySlug(slug) {
	const requestOptions = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
		qs: { 'slug': slug },
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};

	let res = await rp(requestOptions);
	// console.log(res);
	if (res && res.data) {
		let allK = Object.keys(res.data);
		if (allK.length > 0) {
			// console.log(res);
			return new CmcCoin(res.data[Object.keys(res.data)[0]]);
		}
	}
}
 
/**
 * Search on global list {allCoinCmc} and return list of CmcCoins
 * @param {string} symbol 
 * @returns List of CmcCoins, empty list if can not found.
 */
module.exports.cmcFindCoins = function cmcFindCoins(symbol, website) {
	let re = [];
	// console.log(allCoinCmc);
	if (allCoinCmc) {
		allCoinCmc.forEach(c => {
			if (c.symbol.toUpperCase() == symbol.toUpperCase()) {
				re.push(c);
			}
		});
	}

	if (website) {
		let reW = [];
		// console.log(12345465);
		re.forEach(c => {
			if (c.websites) {
				// console.log(c.websites);
				c.websites.forEach(w => {
					// console.log(w);
					if (equalStringIgnoreCase(w, website)) {
						reW.push(c);
					}
				});
			}
		});
		re = reW;
	}
	return re;
}

/**
 * Search on global list {allCoinCmc} and return list of Coins 
 * @param {string} tokenAddr ONE address
 * @returns List of CmcCoins, empty list if can not found.
 */
module.exports.cmcFindCoinsByAddr = function cmcFindCoinsByAddr(tokenAddr) { 
	
	let reToken = [];
	if (tokenAddr) { 
		let addr = tokenAddr.trim().replace(/[^a-zA-Z0-9]/g, "");
		allCoinCmc.forEach(c => {
			if (c.contract_address) {
				c.contract_address.forEach(a => {
					// console.log(a);
					if (equalStringIgnoreCase(a.contract_address, addr)) {
						reToken.push(c);
					}
				});
			}
		}); 
	}

	return reToken;
}

/**
 * string: Alternatively pass one or more comma-separated cryptocurrency symbols. 
 * Example: "BTC,ETH". At least one "id" or "slug" or "symbol" is required for this request.
 * @param {string} symbol Must be uppercase
 * @param {string} contractAddr 
 */
async function cmcMetadata(symbol, contractAddr) {
	let qs;
	if (symbol) {
		qs = {
			'symbol': symbol
		};
	} else if (contractAddr) {
		qs = {
			'address': contractAddr
		};
	}
	const requestOptions = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
		qs: qs,
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};

	let res = await rp(requestOptions);
	if (res && res.data) {
		// console.log(res);
		return new CmcCoin(res.data[symbol]);
	}
}


module.exports.createBscPlatform = function createBSCplatform(tokenAddr) {
	let p = new Platform();
	p.id = 1839;
	p.slug = 'binance-coin';
	p.token_address = tokenAddr;
	return p;
}

module.exports.createEthereumPlatform = function createBSCplatform(tokenAddr) {
	let p = new Platform();
	p.id = 1027;
	p.slug = 'ethereum';
	p.token_address = tokenAddr;
	return p;
}

/**
 * 
 * @param {string} str1 
 * @param {string} str2 
 * @returns 
 */
function equalStringIgnoreCase(str1, str2) {
	return str1 && str2
		&& str1.trim().toLowerCase() == str2.trim().toLowerCase();
}

/**
 * For each contract in params, Open poocoin, pancakeswap and 1inch with that address
 * @param {string} contractAddrs list of contract in one string, separated by comma ','
 */
module.exports.openPooBsc = function openPooBsc(contractAddrs) {
	try {
		let ads = contractAddrs.split(",");
		ads.forEach(element => {
			if (element.length >= 40) {
				open(`https://poocoin.app/tokens/${element}`);
				open(`https://pancakeswap.finance/swap?outputCurrency=${element}`);
				open(`https://app.1inch.io/#/56/swap/BNB/${element}`);
			}
		});
	} catch (error) {
		//logger.error(error);
		console.error(error);
	}
}
module.exports.sendTele = function sendTele(msg, logger) {
	bot.telegram.sendMessage(botChatId, msg).catch(reason => {
		console.error(reason);
		if (logger) {
			logger.error(reason);
		}
	});
}

/**
 * 
 * @param {*} msg Should be string
 * @param {*} logger if logger exist it will log with info level
 */
module.exports.consoleLogWithTime = function consoleLogWithTime(msg, logger) {
	console.log(`${new Date().toLocaleString()}: ${msg}`);
	if (logger) {
		logger.info(msg);
	}
}

/**
	 * 
	 * @param {Array} lst 
	 * @param {*} item 
	 */
module.exports.isListContainItem = function isListContainItem(lst, item) {
	if (lst) {
		for (const i of lst) {
			if (i == item) {
				return true;
			}
		}
	}
	return false;
}
