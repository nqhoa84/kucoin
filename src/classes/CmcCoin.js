module.exports.CmcCoin = class CmcCoin {
    constructor(cmcData) {
        /** {number}: id */
        this.id = cmcData.id;
        this.name = cmcData.name;
        this.symbol = cmcData.symbol;
        this.slug = cmcData.slug;
        if(cmcData.urls) {
            this.websites = cmcData.urls.website;
            this.chats = cmcData.urls.chat;
        }
        this.contract_address = cmcData.contract_address;
        this.category = cmcData.category;
    }

    get getTelegroupUrl() {
        if(this.chats) {
            for (const str of this.chats) {
                if(`${str}`.startsWith(`https://t.me/`)) {
                    return `${str}`;
                }
            }
        }
        return '';
    }

    getTelegroupUrl2() {
        if(this.chats) {
            for (const str of this.chats) {
                if(`${str}`.startsWith(`https://t.me/`)) {
                    return `${str}`;
                }
            }
        }
        return '';
    }

    // get getBscTokenAddress() {
    //     let re = '';
    //     if(this.contract_address && this.contract_address.platform) {
    //         if(this.contract_address.platform.name == 'Avalanche') {
    //             return `${this.contract_address.contract_address}`;
    //         }
    //     }
    //     return re;
    // }

    getBscTokenAddress2() {
        let re = '';
        if(this.contract_address && this.contract_address.platform) {
            if(this.contract_address.platform.name == 'Avalanche') {
                return `${this.contract_address.contract_address}`;
            }
        }
        return re;
    }
}
 

module.exports.Platform = class Platform {
    constructor(cmcData) {
        if(cmcData) {
            /** {number}: id */
            this.id = cmcData.id;
            this.name = cmcData.name;
            this.symbol = cmcData.symbol;
            this.slug = cmcData.slug;
            this.token_address = cmcData.token_address;
        }
    } 
}