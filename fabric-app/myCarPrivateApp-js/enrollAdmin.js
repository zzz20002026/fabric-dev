/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
// 
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');


//for VSCode Local Fabric Network
//const connectionProfile = "2Org2PeerOrg1GatewayConnection.json";
// const caServer = "org1ca-api.127-0-0-1.nip.io:8081";
// const orgName = "Org1";
// const orgMSPID = "Org1MSP";
// const enrollID = "admin";
// const enrollSecret = "adminpw";
// const identityLabel = "admin";


//for Fabric Dev Network
const connectionProfile = "connection.json";
const caServer = "ca.org1.example.com";
const orgName = "org1.example.com";
const orgMSPID = "Org1MSP";
const enrollID = "admin";
const enrollSecret = "adminpw";
const identityLabel = "admin";


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
        //const caTLSCACerts = caInfo.tlsCACerts.pem;
        //const caClient = new FabricCAServices(caInfo.url, {trustedRoots: caTLSCACerts, verify: false}, caInfo.caName);
        
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet', orgName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.get(identityLabel);
        if (adminExists) {
            console.log(`An identity for the admin user ${identityLabel} already exists in the wallet`);
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await caClient.enroll({ enrollmentID: enrollID, enrollmentSecret: enrollSecret });
        
        const identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMSPID,
			type: 'X.509',
		};

        await wallet.put(identityLabel, identity);
        console.log(`Successfully enrolled admin user ${identityLabel} and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to enroll admin user ${identityLabel}: ${error}`);
        process.exit(1);
    }
}

main();
