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

describe('Transaction Participant', () => {
    const NS = 'org.acme.smartdonation.participant';
    var numDonors = 0;
    
    async function getCustomerId(bnc) {
        let customerId = '';
        let results = await bnc.query('SelectAllCustomers');
        if (results.length > 0)
            customerId = results[0].participantId;
        return customerId;
    }

    async function getDonorId(bnc, customerId) {
        const donors = await bnc.query('SelectAllDonors');
        const donor = donors.find(dn => dn.customer.getIdentifier() == customerId);
        if (donor)
            return donor.participantId;
        else
            return '';
    }
    
    before((done)=>{
        businessNetworkConnection.query('SelectAllCustomers')
        .then(results=> {
            numDonors = results.length;
            done();
        }).catch((err)=>{
            console.log('Transaction customer - before: ', err);
        })
    });
    
    // Test Case # 1 Sunny day path - we are able to assign an aircraft to the flight
    it('create a Customer', () => {
        const methodName = 'CreateCustomer';
        // Create the instance
        let transaction = factory.newTransaction(NS, methodName);
        transaction.setPropertyValue('phoneNumber', '123-123-1234');
        transaction.setPropertyValue('email', 'john@me.com');
        transaction.setPropertyValue('note', 'great charity done right');
        transaction.setPropertyValue('status', 'ACTIVE');
        transaction.setPropertyValue('isRead', false);
        transaction.setPropertyValue('isWrite', false);
        transaction.setPropertyValue('isAccountOnly', false);
        transaction.setPropertyValue('isDepartmentOnly', false);
        transaction.setPropertyValue('isAll', false);
        transaction.setPropertyValue('name', 'john');
      
        return businessNetworkConnection.submitTransaction(transaction).then(()=>{
            assert(true);
        }).catch((error)=>{
            assert(false, error);
        })
    });

    it('Set customer to inactive', async () => {
        try {
            const participantId = await getCustomerId(businessNetworkConnection);
            if (participantId !== '') {
                const methodName = 'SetCustomerStatus';
                let transaction = factory.newTransaction(NS, methodName);
                transaction.setPropertyValue('participantId', participantId);
                transaction.setPropertyValue('status', 'INACTIVE');
                await businessNetworkConnection.submitTransaction(transaction);
                let list2 = await businessNetworkConnection.query('SelectAllCustomers');
                if (list2.length <= 0)
                    assert(false, 'no customers in the registry 2');
                assert.equal(list2[0].status, 'INACTIVE');
            }
            else 
                assert(false, 'no customer to test.');
        } catch(err){
            assert(false, err);
        }
    })

    // Test Case # 1 Sunny day path - we are able to assign an aircraft to the flight
    it('create a Donor', async () => {
        try {
            let customerId = await getCustomerId(businessNetworkConnection);

            const methodName = 'CreateDonor';
            // Create the instance
            let transaction = factory.newTransaction(NS, methodName);
            transaction.setPropertyValue('phoneNumber', '123-123-1234');
            transaction.setPropertyValue('email', 'donor1@me.com');
            transaction.setPropertyValue('note', 'great charity done right');
            transaction.setPropertyValue('status', 'ACTIVE');
            transaction.setPropertyValue('isRead', false);
            transaction.setPropertyValue('isWrite', false);
            transaction.setPropertyValue('isAccountOnly', false);
            transaction.setPropertyValue('isDepartmentOnly', false);
            transaction.setPropertyValue('isAll', false);
            transaction.setPropertyValue('name', 'donor1');
            transaction.setPropertyValue('customerId', customerId);
        
            await businessNetworkConnection.submitTransaction(transaction);
            assert(true);
        }
        catch(err) {
            assert(false, error);
        }
    });

    it('disable a donor', async()=> {
        try {
            let customerId = await getCustomerId(businessNetworkConnection);
            let donorId = await getDonorId(businessNetworkConnection, customerId);
            assert.notEqual(donorId, '');
        }
        catch(err){
            assert(false, err);
        }
    });

});
