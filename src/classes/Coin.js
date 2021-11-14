module.exports.Coin = class Coin {
    constructor(cmcData) {
        /** {number}: id */
        this.id = cmcData.id;
        this.name = cmcData.name;
        this.symbol = cmcData.symbol;
        this.slug = cmcData.slug;
        if(cmcData.urls) {
            this.websites = cmcData.urls.website;
        }
        this.contract_address = cmcData.contract_address;
        this.category = cmcData.category;
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