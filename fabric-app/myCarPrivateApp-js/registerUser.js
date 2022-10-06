/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

//for VSCode Local Fabric Network
// const connectionProfile = "2Org2PeerOrg1GatewayConnection.json";
// const caServer = "org1ca-api.127-0-0-1.nip.io:8081";
// const orgName = "Org1";
// const orgMSPID = "Org1MSP";
// const adminEnrollID = "admin";
// const adminIdentityLabel = "admin";
// const newUserOrgDept = "org1.department1";
// const newUserEnrollID = "Org1 User1"
// const newUserEnrollSecret = "user1pw"
// const newIdentityLabel = "Org1 User1"


//for Fabric Dev Network
const connectionProfile = "connection.json";
const caServer = "ca.org1.example.com";
const orgName = "org1.example.com";
const orgMSPID = "Org1MSP";
const adminEnrollID = "admin";
const adminIdentityLabel = "admin";
const newUserOrgDept = "org1.department1";
const newUserEnrollID = "User2"
const newUserEnrollSecret = "user2pw"
const newIdentityLabel = "User2@org1.example.com"

// 設定讀取Getway Connection Profile: connection.json
const ccpPath = path.resolve(__dirname, connectionProfile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities[caServer];

        //for VSCode Local Fabric Network
        const caClient = new FabricCAServices(caInfo.url);

        //for Fabric Dev Network
        // 依據Connection Profile建立CA Client
        //const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        //const caTLSCACerts = caInfo.tlsCACerts.pem;
        //const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        // 指定存放憑證的Wallet目錄路徑
        const walletPath = path.join(process.cwd(), 'wallet', orgName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(newIdentityLabel);
        if (userIdentity) {
            console.log(`An identity for the user ${newIdentityLabel} already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        // 從錢包讀取具註冊權限的admin帳號登錄憑證
        const adminIdentity = await wallet.get(adminIdentityLabel);
        if (!adminIdentity) {
            console.log(`An identity for the admin user ${adminIdentityLabel} does not exist in the wallet`);
            console.log(`Run the enrollAdmin.js application before retrying`);
            return;
        }

        // build a user object for authenticating with the CA
        // 從錢包帳號註冊表取得提供者帳號
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminEnrollID);

        // Register the user, enroll the user, and import the new identity into the wallet.
		// if affiliation is specified by client, the affiliation value must be configured in CA.
        // If enrollmentSecret is specified by client, the secret is same as enrollmentSecret.
        // 連線CA Server並註冊使用帳號
		const secret = await caClient.register({
			affiliation: newUserOrgDept,
			enrollmentID: newUserEnrollID,
            enrollmentSecret: newUserEnrollSecret,
			role: 'client',
            maxEnrollments: -1,
            attrs:[{ gender: 'man'}]
		}, adminUser);

        // 連線CA Server並登錄使用者帳號
		const enrollment = await caClient.enroll({
			enrollmentID: newUserEnrollID,
			enrollmentSecret: secret
		});
		
        // 設定憑證內容
        const identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMSPID,
			type: 'X.509',
		};

        // 匯出憑證至Wallet
        await wallet.put(newIdentityLabel, identity);
        console.log(`Successfully registered and enrolled admin user ${newIdentityLabel} and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user ${newIdentityLabel}: ${error}`);
        process.exit(1);
    }
}

main();
