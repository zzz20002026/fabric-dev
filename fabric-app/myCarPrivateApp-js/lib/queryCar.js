const { Wallets, Gateway } = require('fabric-network');

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
const ccpPath = path.resolve(__dirname, '..', connectionProfile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main(carId) {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet', orgName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        //console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        //const userExists = await wallet.get('User1@org1.example.com');
        const userExists = await wallet.get(userIdentity);
        if (!userExists) {
            console.log('An identity for the user "User1@org1.example.com" does not exist in the wallet');
            //return { status: "500", data: { error: { status: 500, message: "沒有合約帳號！" } } };
            throw new Error(`使用者憑證不存在！`);
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { 
            wallet, 
            //identity: 'User1@org1.example.com', 
            identity: userIdentity, 
            discovery: { enabled: true, asLocalhost: false } 
        });

        // Get the network (channel) our contract is deployed to.
        //const network = await gateway.getNetwork('dev-channel');
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        //const contract = network.getContract('mycar');
        const contract = network.getContract(contrcatName);

        // Submit the specified transaction.
        // 智慧合約回傳值為JSON String
        const resResult = await contract.evaluateTransaction('readMyCar', carId);
        console.log(`Result: ${resResult}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        //當智慧合約發生錯誤正確作法應回傳狀態碼500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此不論智慧合約執行狀態仍回傳狀態碼200
        return { 
            status: 200, 
            data: resResult 
        };

    } catch (error) {
        console.error(`Failed to connect fabric network: `);
        console.error("message: "+ error.message);
        console.error("stack: "+ error.stack);
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
    queryCar: function (carId) {
        return main(carId).then(function (rs) {

            return rs;
        });
    }
}
