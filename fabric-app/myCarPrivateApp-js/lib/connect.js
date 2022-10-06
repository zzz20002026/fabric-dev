//const { throws } = require('assert');
const { Wallets, Gateway, Transaction } = require('fabric-network');
const EventStrategies = require('fabric-network/lib/impl/event/defaulteventhandlerstrategies'); 

const fs = require('fs');
const path = require('path');

//for VSCode Local Fabric Network
// const connectionProfile = "2Org2PeerOrg1GatewayConnection.json";
// const orgName = "Org1";
// const userIdentity = "Org1 Admin";
// const channelName = "mychannel";
// const contrcatName = "mycar";

//for Fabric Dev Network
const connectionProfile = "connection.json";
const orgName = "org1.example.com";
const userIdentity = "User2@org1.example.com";
const channelName = "dev-channel";
const contrcatName = "mycar";

//const ccpPath = path.resolve(__dirname, 'connection.json');
// 設定讀取Getway Connection Profile: connection.json
const ccpPath = path.resolve(__dirname, '..', connectionProfile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


/**
 * Perform a sleep -- asynchronous wait
 * @param ms the time in milliseconds to sleep for
 */
 function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 顯示交易內容
 * @param {*} transactionData 
 */
function showTransactionData(transactionData) {
    console.log(`*** Transaction Data ***`);

	const creator = transactionData.actions[0].header.creator;
	console.log(`    - submitted by: ${creator.mspid}-${creator.id_bytes.toString('hex')}`);

	for (const endorsement of transactionData.actions[0].payload.action.endorsements) {
		console.log(`    - endorsed by: ${endorsement.endorser.mspid}-${endorsement.endorser.id_bytes.toString('hex')}`);
	}

	const chaincode = transactionData.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec;
	console.log(`    - chaincode: ${chaincode.chaincode_id.name}`);
	console.log(`    - function: ${chaincode.input.args[0].toString()}`);

	for (let x = 1; x < chaincode.input.args.length; x++) {
		console.log(`    - arg[${x}]: ${chaincode.input.args[x].toString()}`);
	}

    console.log(``);
}

/**
 * 連線Hyperledger Fabric Network執行智慧合約
 * @param {String} funcName: 智慧合約函式自訂別名
 * @param {String[]} args: 智慧合約傳入參數陣列
 * @returns Object
 * @example executeChaincode("queryCar", ["car1"])
 * return {status: 200, data: {"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Tom"}}
*/
async function main(funcName, args) {
    try {
        // Create a new file system based wallet for managing identities.
        // 指定存放憑證的Wallet目錄路徑
        const walletPath = path.join(process.cwd(), 'wallet', orgName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        //console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        //const userExists = await wallet.get('User1@org1.example.com');
        const userExists = await wallet.get(userIdentity);
        if (!userExists) {
            console.log(`An identity for the user ${userIdentity} does not exist in the wallet`);
            //return { status: "500", data: { error: { status: 500, message: "沒有合約帳號！" } } };
            throw new Error(`使用者憑證不存在！`);
        }

        // Create a new gateway for connecting to our peer node.
        // // 建立gateway用以連線節點
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            //identity: 'User1@org1.example.com', 
            identity: userIdentity,
            //discovery: { enabled: true, asLocalhost: false, eventHandlerOptions: EventStrategies.MSPID_SCOPE_ALLFORTX }
            discovery: { enabled: true, asLocalhost: false, eventHandlerOptions: EventStrategies.NONE }
        });

        // Get the network (channel) our contract is deployed to.
        //const network = await gateway.getNetwork('dev-channel');
        // 存取已部屬智慧合約的Channel
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        //const contract = network.getContract('myasset');
        // 從Channel取得智慧合約
        const contract = network.getContract(contrcatName);

        // setup receive event
        // 設定監聽器用以訂閱智慧合約事件(Event)廣播
        let listener;
        let blockListener; 

        try {
            // create a contract listener
            listener = async (event) => {

                // 讀取Event回傳的資料
                const eventPlayload = JSON.parse(event.payload.toString('utf8'));
                //console.log(`Contract Event Received: ${event.eventName} - ${JSON.stringify(eventPlayload)}`);
                console.log(`*** Contract Event Received ***`);
                console.log(`*** Event: ${event.eventName}, Playload: ${JSON.stringify(eventPlayload)}`);

                // 讀取Transaction Event
                const eventTransaction = event.getTransactionEvent();
                console.log(`*** transaction: ${eventTransaction.transactionId}, status:${eventTransaction.status}`);

                // 讀取Block Event
                const eventBlock = eventTransaction.getBlockEvent();
                console.log(`*** block: ${eventBlock.blockNumber.toString()}`);
                console.log(``);

            };

            console.log(`### Start contract event stream to peer in Org1`);
            // 加入合約監聽器
            await contract.addContractListener(listener);
        } catch (eventError) {
            console.error(`Failed: Setup contract events - ${eventError}`);
        }

        try {
            // create a block listener
            blockListener = async (event) => {
                //This block event represents the current top block of the ledger.
                //All block events after this one are events that represent new blocks added to the ledger
                console.log(`### Block Event Received - block number: ${event.blockNumber.toString()}`);

                const transEvents = event.getTransactionEvents();
                for (const transEvent of transEvents) {
                    console.log(`*** transaction event: ${transEvent.transactionId}`);
                    if (transEvent.privateData) {
                        for (const namespace of transEvent.privateData.ns_pvt_rwset) {
                            console.log(`    - private data: ${namespace.namespace}`);
                            for (const collection of namespace.collection_pvt_rwset) {
                                console.log(`     - collection: ${collection.collection_name}`);
                                if (collection.rwset.reads) {
                                    for (const read of collection.rwset.reads) {
                                        console.log(`       - read set - key: ${read.key}  value:${read.value.toString()}`);
                                    }
                                }

                                if (collection.rwset.writes) {
                                    for (const write of collection.rwset.writes) {
                                        console.log(`      - write set - key:${write.key} is_delete:${write.is_delete} value:${write.value.toString()}`);
                                    }
                                }
                            }
                        }
                    }

                    if (transEvent.transactionData) {
                        showTransactionData(transEvent.transactionData);
                    }
                }
            };
            // now start the client side event service and register the listener
            console.log(`### Start private data block event stream to peer in Org1`);
            await network.addBlockListener(blockListener, {type: 'private'});
        } catch (eventError) {
            console.error(`Failed: Setup block events - ${eventError}`);
        }

        // Submit the specified transaction.
        // 智慧合約回傳值為JSON String
        let resResult;
        let carId = "";
        let brand = "";
        let model = "";
        let color = "";
        let owner = "";
        let newOwner = "";
        let startCarId = "";
        let endCarId = "";
        let price = "";
        let mfgDate = "";
        switch (funcName) {
            case "queryCar":
                carId = args[0];
                console.log(`evaluateTransaction for chaincode readMyCar`);
                // 以evaluate Transaction調用智慧合約
                resResult = await contract.evaluateTransaction("readMyCar", carId);
                break;
                
            case "createCar":
                carId = args[0];
                brand = args[1];
                model = args[2];
                color = args[3];
                owner = args[4];
                price = args[5];
                mfgDate = args[6];

                console.log(`submitTransaction for chaincode createMyCar`);
                //resResult = await contract.submitTransaction("createMyCar", carId, brand, model, color, owner);
                
                //create transaction for call private contract
                const createCarTx = contract.createTransaction("createMyCar");

                //setup transient map for private data 
                createCarTx.setTransient({
                    price: Buffer.from(price),
                    mfg: Buffer.from(mfgDate)
                });

                //setup endorsment org
                createCarTx.setEndorsingOrganizations('Org1MSP');

                //submit transaction
                resResult = await createCarTx.submit(carId, brand, model, color, owner);
                break;
            
            case "queryCarPrice":
                carId = args[0];
                console.log(`evaluateTransaction for chaincode readMyCarPrice`);
                resResult = await contract.evaluateTransaction("readMyCarPrice", carId);
                break;
                
            case "queryCarMFGDate":
                carId = args[0];
                console.log(`evaluateTransaction for chaincode readMyCarMFGDate`);
                resResult = await contract.evaluateTransaction("readMyCarMFGDate", carId);
                break;                

            case "updateCarPrice":
                carId = args[0];
                price = args[1];
                console.log(`submitTransaction for chaincode updateMyCarPrice`);

                //create transaction for call private contract
                const updateCarPriceTx = contract.createTransaction("updateMyCarPrice");

                //setup transient map for private data 
                updateCarPriceTx.setTransient({
                    price: Buffer.from(price)
                });

                //setup endorsment org
                updateCarPriceTx.setEndorsingOrganizations('Org1MSP');

                //submit transaction
                resResult = await updateCarPriceTx.submit(carId);
                break;

            case "transferCar":
                carId = args[0];
                newOwner = args[1];
                console.log(`submitTransaction for chaincode transferMyCar`);
                resResult = await contract.submitTransaction("transferMyCar", carId, newOwner);
                break;
                
            case "deleteCar":
                carId = args[0];
                console.log(`submitTransaction for chaincode deleteMyCar`);

                //create transaction for call private contract
                const deleteCarTx = contract.createTransaction("deleteMyCar");

                //setup endorsment org
                deleteCarTx.setEndorsingOrganizations('Org1MSP', 'Org2MSP');

                //submit transaction
                resResult = await deleteCarTx.submit(carId);
                // 以submit Transaction調用智慧合約
                //resResult = await contract.submitTransaction("deleteMyCar", carId);
                break;

            case "queryCarPriceByRange":
                startCarId = args[0];
                endCarId = args[1];
                console.log(`evaluateTransaction for chaincode queryMyCarPriceByRange`);
                resResult = await contract.evaluateTransaction("queryMyCarPriceByRange", startCarId, endCarId);
                break;

            case "queryCarByPrice":
                price = args[0];
                console.log(`evaluateTransaction for chaincode queryMyCarByPrice`);
                resResult = await contract.evaluateTransaction("queryMyCarByPrice", price);
                break;

            case "queryCarHistory":
                carId = args[0];
                console.log(`evaluateTransaction for chaincode queryMyCarHistory`);
                resResult = await contract.evaluateTransaction("queryMyCarHistory", carId);
                break;
            default:
                break;
        }

        console.log(`Wait for event commit...`);
        await sleep(5000);
        console.log(`Execute Result: ${resResult}`);
        console.log(``);

        // remove listener
        contract.removeContractListener(listener);
		network.removeBlockListener(blockListener);
        
        // Disconnect from the gateway.
        // 與節點中斷連線
        //gateway.disconnect();

        //當智慧合約發生錯誤正確作法應回傳狀態碼500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此不論智慧合約執行狀態仍回傳狀態碼200
        return {
            status: 200,
            data: resResult
        };

    } catch (error) {
        console.error(`Failed to connect fabric network: `);
        console.error("message: " + error.message);
        console.error("stack: " + error.stack);
        const errorObj = {
            status: 500,
            message: "智慧合約連線錯誤!"
        };

        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        return {
            status: 200,
            data: JSON.stringify(errorObj)
        };
    }
}

module.exports = {
/**
 * 連線Hyperledger Fabric Network執行智慧合約
 * @param {String} funcName: 智慧合約函式自訂別名
 * @param {String[]} args: 智慧合約傳入參數陣列
 * @returns Object
 * @example executeChaincode("queryCar", ["car1"])
 * return {status: 200, data: {"brand":"toyota","carId":"car1","color":"white","docType":"car","model":"altis","owner":"Tom"}}
*/
    executeChaincode: function (funcName, args) {
        return main(funcName, args).then(function (rs) {
            // 回傳智慧合約執行結果
            return rs;
        });
    }
}
