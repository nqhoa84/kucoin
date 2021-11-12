const rp = require('request-promise');
const { Coin } = require('./classes/Coin');
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

function cmcListing() {
	const requestOptions = {
		method: 'GET',
		uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
		qs: {
			'start': '1',
			'limit': '100',
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
 * @param {string} symbol 
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
		return new Coin(res.data[symbol]);
	}
}

module.exports = { parseKucoinLink, cmcListing, cmcMetadata };