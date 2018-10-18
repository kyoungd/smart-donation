/**
 * 
 * This is to test the Donor transaction
 * 
 * Pre-requisite
 * =============
 * 
 */

const assert = require('chai').assert;
const utHarness = require('./ut-harness.js')

// This points to the model project folder
var modelFolder = __dirname+'/..'

var adminConnection = {}
var businessNetworkConnection = {}
var bnDefinition = {}
var factory = {}

// Synchronous call so that connections can be established
// Executed before the describe{} gets executed
before((done) => {
    utHarness.debug = false;
    utHarness.initialize(modelFolder, (adminCon, bnCon, definition) => {
        adminConnection = adminCon;
        businessNetworkConnection = bnCon;
        bnDefinition = definition;
        factory = bnDefinition.getFactory();
        done();
    });
});

describe('Transaction donor', () => {
    const NS = 'org.acme.smartdonation.donors';
    var numDonors = 0;
    
    before((done)=>{
        console.log('before async done');
        businessNetworkConnection.query('SelectAllDonors')
        .then(results=> {
            numDonors = results.length;
            done();
        }).catch((err)=>{
            console.log('query error: ', err);
        })
    });
    
    // Test Case # 1 Sunny day path - we are able to assign an aircraft to the flight
    it('create a donor', () => {
        const methodName = 'CreateDonor';
        // Create the instance
        let transaction = factory.newTransaction(NS, methodName);
        transaction.setPropertyValue('name', 'young k');
        transaction.setPropertyValue('phoneNumber', '123-123-1234');
        transaction.setPropertyValue('emailAddress', 'youngk@me.com');
        transaction.setPropertyValue('createdOn', new Date());
        return businessNetworkConnection.submitTransaction(transaction).then(()=>{
            console.log('Donor Added: ');
            assert(true);
        }).catch((error)=>{
            assert(false, error);
        })
    });

});