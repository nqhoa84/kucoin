const rp = require('request-promise');
const { CmcCoin, Platform } = require('../classes/CmcCoin');
const path = require('path');
const open = require('open');
const fs = require('fs-extra');
const cmcDataPath = path.join(__dirname, '../../dbcmc/data.txt');
const allCoinCmc = fs.readJSONSync(cmcDataPath);

const cmcApiKey = `fdd2339e-1241-4b84-8cdf-be2c13881484`;
/**
 * 
 * @param {string} endpoint The CMC api endpoint. Ex endpoint = v1/cryptocurrency/trending/gainers-losers will make the full url = https://pro-api.coinmarketcap.com/v1/cryptocurrency/trending/gainers-losers
 * @param {*} qs The query parameters.
 * @returns 
 */
function createRequestOptions(endpoint, qs) {
	return {
		method: 'GET',
		uri: `https://pro-api.coinmarketcap.com/${endpoint}`,
		qs: qs,
		headers: {
			'X-CMC_PRO_API_KEY': cmcApiKey
		},
		json: true,
		gzip: true
	};
}

module.exports.cmcListing = function cmcListing(start, limit) {
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
module.exports.cmcMetadata = async function cmcMetadata(symbol, contractAddr) {
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

/** 
 */
module.exports.cmcGainerLosers = async function cmcGainerLosers() {
	let qs = { 
		sort: `percent_change_24h`, 
		sort_dir: `asc`
	};
	// const requestOptions22 = {
	// 	method: 'GET',
	// 	uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/trending/gainers-losers',
	// 	qs: qs,
	// 	headers: {
	// 		'X-CMC_PRO_API_KEY': cmcApiKey
	// 	},
	// 	json: true,
	// 	gzip: true
	// };
	let res = await rp(createRequestOptions(`v1/cryptocurrency/trending/gainers-losers`, qs));
	if (res && res.data) {
		return res.data;
	} else {
		return [];
	}
	// let re = [];
	// if (res && res.data) {
	// 	let idList = ids.split(",");
	// 	for (const id of idList) {
	// 		re.push(new CmcCoin(res.data[`${id}`]));
	// 	}
	// }
	// return re;
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
