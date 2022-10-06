/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const Shim = require('fabric-shim');

class MyCarContract extends Contract {

    /**
     * 確認car物件是否存在於Ledger
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @returns true/false
     * @example myCarExists(ctx, "car1")
     * If car1 exist return true 
     * Else return false
    */
    async myCarExists(ctx, carId) {
        const buffer = await ctx.stub.getState(carId);
        return (!!buffer && buffer.length > 0);
    }

    /**
     * 新增Car物件
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @param {String} brand: 廠牌
     * @param {String} model: 型號
     * @param {String} color: 顏色
     * @param {String} owner: 擁有者
     * @param {Transient Object} price: 價格, mfg: 製造日期
     * @returns Car JSON String: 
     * @example createMyCar(ctx, "car1", "toyota", "altis", "white", "Tom")
     * return {"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Tom", "price": "100", "mfgDate": "2021/10/1"}
    */
    async createMyCar(ctx, carId, brand, model, color, owner) {
        const exists = await this.myCarExists(ctx, carId);
        if (exists) {
            //throw new Error(`The car ${carId} already exists`);
            console.error(`The car ${carId} already exists`);
            return Shim.error(`The car ${carId} already exists`);
        }

        // ==== Create car object and marshal to JSON ====
        let car = {
            docType: 'car',
            carId: carId,
            brand: brand,
            model: model,
            color: color,
            owner: owner
        };

        // ==== Create carPrice object and marshal to JSON ====
        const carPrice = {
            docType: "properties",
            carId: carId,
            price: String
        }
        
        // ==== Create carMFG object and marshal to JSON ====
        const carMFG = {
            docType: "properties",
            carId: carId,
            mfgDate: String
        }; 

        // get transient data
        const transientMap = ctx.stub.getTransient();
        if (transientMap){
            // log transient data to Array
            const transientArray = [...transientMap.entries()]; 
            console.info(`transientMap: ${transientArray.toString()}`);

            // get private data from transient data
            const price = transientMap.get('price');
            if (price){
                carPrice.price = price.toString();
                console.info(`price: ${price.toString()}`);
                
            }
            
            const mfg = transientMap.get('mfg');
            if (mfg){
                carMFG.mfgDate = mfg.toString();
                console.info(`mfg: ${mfg.toString()}`);
            }
        } 

        // save to blockchain
        const buffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(carId, buffer);

        const bufferPrice = Buffer.from(JSON.stringify(carPrice))
        await ctx.stub.putPrivateData("Org1PrivateCollection", carId, bufferPrice);

        const bufferMFG = Buffer.from(JSON.stringify(carMFG))
        await ctx.stub.putPrivateData("MfgCollection", carId, bufferMFG);

        // add properties to car Object
        car.price = transientMap.get('price').toString();
        car.mfgDate = transientMap.get('mfg').toString();

        // return result 
        console.info(`Result: ${JSON.stringify(car)}`);

        // setup event
        const bufferEvent = Buffer.from(JSON.stringify(car));
        ctx.stub.setEvent('createMyCar', bufferEvent);

        return JSON.stringify(car);
        //return result by Shim
        //return Shim.success(buffer);
    }

    /**
     * 查詢Car物件
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @returns Car JSON String: 
     * @example readMyCar(ctx, "car1")
     * return {"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Tom"}
    */
    async readMyCar(ctx, carId) {
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }
        const buffer = await ctx.stub.getState(carId);
        const car = JSON.parse(buffer.toString());

        console.info(`Result: ${JSON.stringify(car)}`);

        // setup event
        const bufferEvent = Buffer.from(JSON.stringify(car));

        return JSON.stringify(car);
        //return result by Shim
        //return Shim.success(buffer);
    }

    /**
     * 查詢價格
     * @param {*} ctx: Transation Context 
     * @param {String} carId: Car ID
     * @example readMyCar(ctx, "car1") return "100"
     * @returns price of car(private data)
     */
    async readMyCarPrice(ctx, carId) {
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        const buffer = await ctx.stub.getPrivateData("Org1PrivateCollection", carId);
        const price = JSON.parse(buffer.toString());

        console.info(`Result: ${buffer.toString()}`);
        return JSON.stringify(price);
    }

    async readMyCarPrice2(ctx, carId){
        try {
            // get name of Client Identity
            const creator = await this._getClientIdentityName(ctx);
            console.info(`Creator: ${creator}`);

            if (creator != "Org1 Admin") {
                throw new Error("creator does not have access permission.");
            }

            const exists = await this.myCarExists(ctx, carId);
            if (!exists) {
                console.error(`The car ${carId} does not exists`);
                //return Shim.error(`The car ${carId} does not exists`);
                throw new Error(`The car ${carId} does not exists`);
            }
            
            // read car price from private data collection
            const buffer = await ctx.stub.getPrivateData("Org1PrivateCollection", carId);
            const price = JSON.parse(buffer.toString());

            console.info(`Result: ${JSON.stringify(price)}`);
            return JSON.stringify(price);

        } catch (error) {
            console.error(`readMyCarPrice2 Error: ${error}`);
            return Shim.error(error.message);
        }
    }

    /**
     * get name of Client Identity
     * @param {*} ctx: Transation Context
     * @returns 
     */
    async _getClientIdentityName(ctx){
        const ClientIdentityID = ctx.clientIdentity.getID();
        console.info(`Identity ID: ${ClientIdentityID}`);

        const accountArray = ClientIdentityID.split("::");
        const subjectDNArray = accountArray[1].split("/");

        let name = "";
        for (const str of subjectDNArray){
            if (str.search("CN=") == 0){
                name = str.substr(3, (str.length - 1));
                break;
            }
        }

        console.info(`Client name: ${name}`);
        return name;
    }


    /**
     * 查詢價格雜湊值
     * @param {*} ctx: Transation Context 
     * @param {String} carId: Car ID
     * @example readMyCarPriceHash(ctx, "car1") return h58fe5645f4asf5231189a5sf1
     * @returns hash string of price from private data collection
     */
    async readMyCarPriceHash(ctx, carId) {
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        const buffer = await ctx.stub.getPrivateDataHash("Org1PrivateCollection", carId);
        const hash = buffer.toString('utf8');

        console.info(`Price Hash: ${hash}`);
        return hash;
    }


    /**
     * 查詢製造日期
     * @param {*} ctx: Transation Context 
     * @param {String} carId: Car ID
     * @example readMyCar(ctx, "car1") return "2021/10/1"
     * @returns manufacturing data(mfg date) of car(private data)
     */
     async readMyCarMFGDate(ctx, carId){
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        const buffer = await ctx.stub.getPrivateData("MfgCollection", carId);
        const mfgDate = JSON.parse(buffer.toString());

        console.info(`Result: ${JSON.stringify(mfgDate)}`);
        return JSON.stringify(mfgDate);
    }


    /**
     * 更新價格
     * @param {*} ctx: Transation Context 
     * @param {String} carId 
     * @example updateMyCarPrice(ctx, "car1", "2000") return {docType: "properties", carId: "car1", price: "2000"}
     * @returns car new price from private data collection
     */
    async updateMyCarPrice(ctx, carId){
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        // read car price from private data collection
        const buffer = await ctx.stub.getPrivateData("Org1PrivateCollection", carId);
        const carPrice = JSON.parse(buffer.toString());

        // get transient data
        const transientMap = ctx.stub.getTransient();
        if (transientMap){
            // log transient data to Array
            const transientArray = [...transientMap.entries()]; 
            console.info(`transientMap: ${transientArray.toString()}`);

            // get private data from transient data
            const price = transientMap.get('price');
            if (price){
                // set new price
                carPrice.price = price.toString();
                console.info(`price: ${price.toString()}`);
                
            }
        } 

        // put new data to private data collection
        const bufferPrice = Buffer.from(JSON.stringify(carPrice))
        await ctx.stub.putPrivateData("Org1PrivateCollection", carId, bufferPrice);

        // setup event
        const bufferEvent = Buffer.from(JSON.stringify(carPrice));
        ctx.stub.setEvent('updateMyCarPrice', bufferEvent);

        return JSON.stringify(carPrice);
    }

    /**
     * 更新擁有者
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @param {String} newOwner: 新擁有者
     * @returns Car JSON String
     * @example transferMyCar(ctx, "car1", "Mary")
     * return {"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Mary"}
    */
     async transferMyCar(ctx, carId, newOwner) {
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        const buffer = await ctx.stub.getState(carId);
        const car = JSON.parse(buffer.toString());

        //change the owner
        car.owner = newOwner;

        //update car to ledger
        const newBuffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(carId, newBuffer);

        console.info(`Result: ${JSON.stringify(car)}`);

        // setup event
        const bufferEvent = Buffer.from(JSON.stringify(car));
        ctx.stub.setEvent('transferMyCar', bufferEvent);

        return JSON.stringify(car);
        //return result by Shim
        //return Shim.success(buffer);
    }

    /**
     * 刪除製造日期
     * @param {*} ctx: Transation Context  
     * @param {String} carId  
     * @example deleteMyCarMFG(ctx, "car1") return "The private data of car1 has deleted from MfgCollection."";
     * @returns String
     */
    async _deleteMyCarMFG(ctx, carId){
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        // delete MFG Date in private data collection
        await ctx.stub.deletePrivateData("MfgCollection", carId);
        return `The private data of ${carId} has deleted from MfgCollection.`;
    }

    /**
     * 刪除價格
     * @param {*} ctx: Transation Context  
     * @param {String} carId  
     * @example deleteMyCarMFG(ctx, "car1") return "The private data of car1 has deleted from MfgCollection."";
     * @returns String
     */
     async _deleteMyCarPrice(ctx, carId){
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }

        // delete MFG Date in private data collection
        await ctx.stub.deletePrivateData("Org1PrivateCollection", carId);
        return `The private data of ${carId} has deleted from Org1PrivateCollection.`;
    }

    /**
     * 刪除Car物件
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @returns Empty
     * @example deleteMyCar(ctx, "car1")
     * return ""
    */
     async deleteMyCar(ctx, carId) {
        const exists = await this.myCarExists(ctx, carId);
        if (!exists) {
            console.error(`The car ${carId} does not exists`);
            return Shim.error(`The car ${carId} does not exists`);
        }
        
        // delete Private Data
        await this._deleteMyCarPrice(ctx, carId);
        await this._deleteMyCarMFG(ctx, carId);
        
        // delete Public Data
        await ctx.stub.deleteState(carId);

        console.info(`The car ${carId} has deleted.`);

        // setup event
        const eventPlayload = {
            result: `The car ${carId} has deleted.`
        };
        const bufferEvent = Buffer.from(JSON.stringify(eventPlayload));
        ctx.stub.setEvent('deleteMyCar', bufferEvent);

        return (`${carId} has deleted.`);
        //return result by Shim
        //const buffer = Buffer.from("");
        //return Shim.success(buffer);
    }

    /**
     * 查詢特定範圍的Car物件
     * @param {*} ctx: Transation Context
     * @param {String} startKey: 開始Car ID
     * @param {String} endKey: 結束Car ID
     * @returns Car JSON String Array
     * @example queryCarPriceByRange(ctx, "car1", "car3")
     * return [{docType: "properties", carId: "car1", price: "10000"},{docType: "properties", carId: "car2", price: "11000"}]
    */
    async queryMyCarPriceByRange(ctx, startKey, endKey) {
        let resultsIterator = ctx.stub.getPrivateDataByRange("Org1PrivateCollection", startKey, endKey);
        
        let allResults = [];
        for await (const res of resultsIterator) {
            // push data to Array
            allResults.push(JSON.parse(res.value.toString('utf8')));
        }

        console.info(`Result: ${JSON.stringify(allResults)}`);
        return JSON.stringify(allResults);
    }

    /**
     * 查詢特定價格Car物件
     * @param {*} ctx: Transation Context
     * @param {Number} minPrice: 價格
     * @returns Car JSON String Array
     * @example queryCarByPrice(ctx, "Tom") 
     * return [{"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Tom", price: "10000"}]
     * CouchDB Rich Query reference https://docs.couchdb.org/en/stable/api/database/find.html
    */
    async queryMyCarByPrice(ctx, minPrice) {        
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'properties';
        queryString.selector.price = minPrice;
        //queryString.selector.price.$gte = parseInt(minPrice, 10);

        // queryString = {"selector":{"docType":"properties","price":{"$gte": minPrice}}}
        console.info(`queryString: ${JSON.stringify(queryString)}`);

        const queryStr = JSON.stringify(queryString);
        console.info(`queryStr: ${queryStr}`);

        const resultsIterator = ctx.stub.getPrivateDataQueryResult("Org1PrivateCollection", queryStr);
        console.info(`resultsIterator length: ${resultsIterator.length}`);

        // push public car data and private price data to Array
        let allResults = [];
        for await (const res of resultsIterator) {
            // res Object is one of resultsIterator
            // res Object as KV(key-value) Object
            // res.key == car ID
            // res.value == carPrice object
            
            const carID = res.key;
            const carPrice = JSON.parse(res.value.toString('utf8'))

            // read car public legder data
            const carPublicData = await this.readMyCar(ctx, carID);

            // public car data add price property
            let car = JSON.parse(carPublicData);
            car.price = carPrice.price;

            // push car data to Array
            allResults.push(car);
        }

        //console.info(`Result: ${JSON.stringify(allResults)}`);
        return JSON.stringify(allResults);
    }


    /**
     * 從帳本查詢Car物件交易紀錄
     * @param {*} ctx: Transation Context
     * @param {String} carId: Car ID
     * @returnsKeyModification String Array
     * @example readMyCar(ctx, "car7")
     * return [{"timestamp":{"seconds":"1615047592","nanos":342000000},"txid":"f7b17b304ef75f2fee461ce393895fe540cb8ce088964fee18112dd3953255aa","isDelete":true,"data":"KEY DELETED"},{"timestamp":{"seconds":"1615047574","nanos":53000000},"txid":"864b5b495b3253b7aaffead6dee6a6320b066ed947a0cc8f44367b40bcdc145b","isDelete":false,"data":{"brand":"audi","carId":"car7","color":"brown","docType":"car","model":"A4","owner":"Alex"}},{"timestamp":{"seconds":"1615046815","nanos":624000000},"txid":"f5d347d653b547ffa16630a962fa48d32f58d29b7ead7b9edb4eaf4955bad6d3","isDelete":false,"data":{"docType":"car","carId":"car7","brand":"audi","model":"A4","color":"brown","owner":"Teddy"}}]
    */
    async queryMyCarHistory(ctx, carId) {
        const resultsIterator = ctx.stub.getHistoryForKey(carId);
        let allResults = [];

        for await (const keyMod of resultsIterator) {
            const resp = {
                timestamp: keyMod.timestamp,
                txid: keyMod.txId,
                isDelete: keyMod.isDelete
            }

            if (keyMod.isDelete) {
                resp.data = 'KEY DELETED';
            } else {
                resp.data = JSON.parse(keyMod.value.toString('utf8'));
            }

            allResults.push(resp);
        }

        console.info(`Result: ${JSON.stringify(allResults)}`);
        return JSON.stringify(allResults);
        //return result by Shim
        //const buffer = Buffer.from(JSON.stringify(allResults));
        //return Shim.success(buffer);
    }

 
    async InitLedger(ctx){
        const cars = [
            {
                carId: "car1",
                brand: "toyota",
                model: "altis",
                color: "white",
                owner: "Tom",
                price: "10000",
                mfgDate: "2020/10/1"

            },
            {
                carId: "car2",
                brand: "honda",
                model: "civic",
                color: "white",
                owner: "Ken",
                price: "10500",
                mfgDate: "2020/11/1"
            },
            {
                carId: "car3",
                brand: "bmw",
                model: "320",
                color: "blue",
                owner: "Bom",
                price: "20000",
                mfgDate: "2020/8/1"
            },
            {
                carId: "car4",
                brand: "benz",
                model: "A180",
                color: "red",
                owner: "Joe",
                price: "20000",
                mfgDate: "2020/6/1"
            },
            {
                carId: "car5",
                brand: "Ford",
                model: "focus",
                color: "black",
                owner: "Max",
                price: "10500",
                mfgDate: "2020/4/1"
            },
            {
                carId: "car6",
                brand: "Peugeot",
                model: "206",
                color: "violet",
                owner: "Grace",
                price: "15000",
                mfgDate: "2020/12/1"
            }
        ];

        for (const car of cars) {
            // ==== Create car object and marshal to JSON ====
            let carObject = {
                docType: 'car',
                carId: car.carId,
                brand: car.brand,
                model: car.model,
                color: car.color,
                owner: car.owner
            };

            // ==== Create carPrice object and marshal to JSON ====
            const carPrice = {
                docType: "properties",
                carId: car.carId,
                price: car.price
            }

            // ==== Create carMFG object and marshal to JSON ====
            const carMFG = {
                docType: "properties",
                carId: car.carId,
                mfgDate: car.mfgDate,
            };

            // save to blockchain
            const buffer = Buffer.from(JSON.stringify(carObject));
            await ctx.stub.putState(car.carId, buffer);

            const bufferPrice = Buffer.from(JSON.stringify(carPrice))
            await ctx.stub.putPrivateData("Org1PrivateCollection", car.carId, bufferPrice);

            const bufferMFG = Buffer.from(JSON.stringify(carMFG))
            await ctx.stub.putPrivateData("MfgCollection", car.carId, bufferMFG);
        }
    } 

}

module.exports = MyCarContract;
