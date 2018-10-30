"use strict"

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
const NS = 'org.acme.smartdonation';
const nsParticipant = NS + '.participant';
const nsObject = NS + '.object';
const nsUtil = NS + '.util';

// This points to the model project folder
var modelFolder = __dirname+'/..'

var adminConnection = {}
var businessNetworkConnection = {}
var bnDefinition = {}
var factory = {}

function newid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function emailId() {
    const high = 9999;
    const low = 1000;
    return (Math.random() * (high - low) + low).toString();
}

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

async function getCustomerCount(bnc) {
    let results = await bnc.query('SelectAllCustomers');
    return results.length;
}

async function getObject(objectType, entityId) {
    const fns = nsObject + "." + objectType;
    const registry = await businessNetworkConnection.getAssetRegistry(fns);
    let item = await registry.get(entityId);
    return item;
}

async function getParticipant(objectType, entityId) {
    const fns = nsParticipant + "." + objectType;
    const registry = await businessNetworkConnection.getParticipantRegistry(fns);
    let item = await registry.get(entityId);
    return item;
}

async function createBankAccount(factory, entity) {
    try {
        let bankAccountId = newid();
        let namespace = NS + '.util';
        let fns = namespace + '.BankAccount';
        let bankAccount = factory.newResource(namespace, 'BankAccount', bankAccountId);
        bankAccount.entityId = bankAccountId;
        bankAccount.accountNumber = entity.accountNumber;
        bankAccount.routingNumber = entity.routingNumber;
        bankAccount.status = entity.status;
        bankAccount.note = entity.note;
        bankAccount.createdOn = entity.createdOn;
        const registry = await businessNetworkConnection.getAssetRegistry(fns);
        await registry.add(bankAccount);
        return bankAccount.entityId;
    }
    catch (err) {
        throw new Error('createBankAccount(): ' + err);
    }
}

async function createABankAccount(factory) {
    let timeStampNow = new Date();
    let entity = {
        accountNumber: newid(),
        routingNumber: newid(),
        status: "ACTIVE",
        note: "a lot of things to say",
        createdOn: timeStampNow
    }
    let bankAccountId = await createBankAccount(factory, entity);
    return bankAccountId;
}

function setParticipantBaseValues(factory, entityType, entity) {
    let participantId = newid();
    let namespace = NS + '.participant';
    let access = factory.newConcept(namespace, 'RoleAccess');
    access.isRead = entity.isRead;
    access.isWrite = entity.isWrite;
    access.isAccountOnly = entity.isAccountOnly;
    access.isDepartmentOnly = entity.isDepartmentOnly;
    access.isAll = entity.isAll;
    let baseEntity = factory.newResource(namespace, entityType, participantId);
    baseEntity.participantId = participantId;
    baseEntity.phoneNumber = entity.phoneNumber;
    baseEntity.email = entity.email;
    baseEntity.note = entity.note;
    baseEntity.access = access;
    baseEntity.status = entity.status;
    return baseEntity;
}

async function createACustomer(factory, name) {
    try {
        let namespace = NS + '.participant';
        let entity = {
            isRead: true,
            isWrite: true,
            isAccountOnly: true,
            isDepartmentOnly: false,
            isAll: true,
            phoneNumber: "123-123-1234",
            email: "c-" + emailId() + "@customer.com",
            note: "a lot of things to say",
            status: "ACTIVE",
            name
        }
        let item = setParticipantBaseValues(factory, 'Customer', entity);
        item.name = entity.name;

        let fns = namespace + '.Customer';
        const registry = await businessNetworkConnection.getParticipantRegistry(fns);
        await registry.add(item);
        return item.participantId;
    }
    catch (err) {
        throw new Error('CreateCustomer(): ' + err);
    }
}

async function createDonor(factory, entity) {
    try {
        let namespace = NS + '.participant';
        let fns = namespace + '.Donor';

        let item = setParticipantBaseValues(factory, 'Donor', entity);
        item.name = entity.name;

        item.customer = factory.newRelationship(namespace, 'Customer', entity.customerId);
        item.bankAccount = factory.newRelationship(NS + '.util', 'BankAccount', entity.bankAccountId);
        const registry = await businessNetworkConnection.getParticipantRegistry(fns);
        await registry.add(item);
        return item.participantId;
    }
    catch (err) {
        throw new Error('createDonor(): ' + err);
    }
}

async function createADonor(factory, name, customerId, bankAccountId) {
    let entity = {
        isRead: true,
        isWrite: true,
        isAccountOnly: true,
        isDepartmentOnly: false,
        isAll: true,
        phoneNumber: "123-123-1234",
        email: "d-" + emailId() + "@donor.com",
        note: "a lot of things to say",
        status: "ACTIVE",
        name,
        customerId,
        bankAccountId,
    }
    let donorId = await createDonor(factory, entity);
    return donorId;
}

async function createSupplier(factory, entity) {
    try {
        let namespace = NS + '.participant';
        let fns = namespace + '.Supplier';

        let item = setParticipantBaseValues(factory, 'Supplier', entity);
        item.name = entity.name;

        item.customer = factory.newRelationship(namespace, 'Customer', entity.customerId);
        item.bankAccount = factory.newRelationship(NS + '.util', 'BankAccount', entity.bankAccountId);
        const registry = await businessNetworkConnection.getParticipantRegistry(fns);
        await registry.add(item);
        return item.participantId;
    }
    catch (err) {
        throw new Error('createSupplier(): ' + err);
    }
}

async function createASupplier(factory, name, customerId, bankAccountId) {
    let entity = {
        isRead: true,
        isWrite: true,
        isAccountOnly: true,
        isDepartmentOnly: false,
        isAll: true,
        phoneNumber: "123-123-1234",
        email: "s-" + emailId() + "@donor.com",
        note: "a lot of things to say",
        status: "ACTIVE",
        name,
        customerId,
        bankAccountId,
    }
    let supplierId = await createSupplier(factory, entity);
    return supplierId;
}

async function createDonation(factory, entity) {
    try {
        let fns = nsObject + '.Donation';
        let item = factory.newResource(nsObject, 'Donation', entity.entityId);
        item.entityId = entity.entityId;
        item.name = entity.name;
        item.description = entity.description;
        item.amount = entity.amount;
        item.status = entity.status;
        item.donateOn = entity.donateOn;
        item.availableOn = entity.availableOn;
        item.rules = entity.rules.slice(0);
        item.note = entity.note;
        item.customer = factory.newRelationship(nsParticipant, 'Customer', entity.customerId);
        item.donor = factory.newRelationship(nsParticipant, 'Donor', entity.donorId);
        item.bankAccount = factory.newRelationship(nsUtil, 'BankAccount', entity.bankAccountId);

        const registry = await businessNetworkConnection.getAssetRegistry(fns);
        await registry.add(item);
        return item.entityId;
    }
    catch (err) {
        throw new Error('--createDonation(): ' + err);
    }
}

async function createADonation(factory, name, customerId, donorId, bankAccountId) {
    let timeStampNow = new Date();
    let entity = {
        entityId: newid(),
        description: "postive ad only donation",
        donateOn: timeStampNow,
        amount: 5000000,
        availableOn: timeStampNow,
        note: "a lot of things to say",
        status: "ACTIVE",
        name,
        customerId,
        donorId,
        bankAccountId,
        rules: ["must be humorous", "ads must be positive", "must focus on family value"],
    }
    let donationId = await createDonation(factory, entity);
    return donationId;
}

async function createCampaign(factory, entity) {
    try {
        let fns = nsObject + '.Campaign';
        let item = factory.newResource(nsObject, 'Campaign', entity.entityId);
        item.entityId = entity.entityId;
        item.name = entity.name;
        item.description = entity.description;
        item.amount = entity.amount;
        item.status = entity.status;
        item.createdOn = entity.createdOn;
        item.createdOn = entity.createdOn;
        item.customer = factory.newRelationship(nsParticipant, 'Customer', entity.customerId);
        item.donor = factory.newRelationship(nsParticipant, 'Donor', entity.donorId);
        item.donation = factory.newRelationship(nsObject, 'Donation', entity.donationId);
        item.bankAccount = factory.newRelationship(nsUtil, 'BankAccount', entity.bankAccountId);

        const registry = await businessNetworkConnection.getAssetRegistry(fns);
        await registry.add(item);
        return item.entityId;
    }
    catch (err) {
        throw new Error('createCampaign(): ' + err);
    }
}

async function CreateACampaign(factory, name, customerId, donorId, donationId, bankAccountId) {
    let timeStampNow = new Date();
    let entity = {
        entityId: newid(),
        description: "donor approved ad campaign",
        amount: 5000000,
        createdOn: timeStampNow,
        status: "ACTIVE",
        name,
        customerId,
        donorId,
        donationId,
        bankAccountId,
    }
    let campaignId = await createCampaign(factory, entity);
    return campaignId;
}

async function CreateCampaignRequest(factory, entity) {
    try {
        let fns = nsObject + '.CampaignRequest';
        let item = factory.newResource(nsObject, 'CampaignRequest', entity.entityId);
        item.entityId = entity.entityId;
        item.amount = entity.amount;
        item.createdOn = entity.createdOn;
        item.description = entity.description;
        item.name = entity.name;
        item.requestStatus = entity.requestStatus;
        item.requestStatusReason = entity.requestStatusReason;
        item.status = entity.status;
        item.campaign = factory.newRelationship(nsObject, 'Campaign', entity.campaignId);
        item.customer = factory.newRelationship(nsParticipant, 'Customer', entity.customerId);
        item.donation = factory.newRelationship(nsObject, 'Donation', entity.donationId);
        item.donor = factory.newRelationship(nsParticipant, 'Donor', entity.donorId);
        item.supplier = factory.newRelationship(nsParticipant, 'Supplier', entity.supplierId);

        const registry = await businessNetworkConnection.getAssetRegistry(fns);
        await registry.add(item);
        return item.entityId;
    }
    catch (err) {
        throw new Error('CreateCampaignRequest(): ' + err);
    }
}

async function CreateACampaignRequest(factory, name, campaignId, customerId, donationId, donorId, supplierId) {
    let timeStampNow = new Date();
    let entity = {
        entityId: newid(),
        amount: 5000000,
        createdOn: timeStampNow,
        description: "donor approved ad campaign",
        name,
        requestStatus: "WAITING",
        requestStatusReason: "...",
        status: "ACTIVE",
        campaignId,
        customerId,
        donationId,
        donorId,
        supplierId
    }
    let campaignRequestId = await CreateCampaignRequest(factory, entity);
    return campaignRequestId;
}

async function CreateProduct(entity) {
    try {
        let fns = nsObject + '.Product';
        let item = factory.newResource(nsObject, 'Product', entity.entityId);
        item.entityId = entity.entityId;
        item.approvalResponse = entity.approvalResponse;
        item.approvalStatus = entity.approvalStatus;
        item.createdOn = entity.createdOn;
        item.description = entity.description;
        item.name = entity.name;
        item.note = entity.note;
        item.productStatus = entity.productStatus;
        item.campaign = factory.newRelationship(nsObject, 'Campaign', entity.campaignId);
        item.customer = factory.newRelationship(nsParticipant, 'Customer', entity.customerId);
        item.donation = factory.newRelationship(nsObject, 'Donation', entity.donationId);
        item.donor = factory.newRelationship(nsParticipant, 'Donor', entity.donorId);
        item.supplier = factory.newRelationship(nsParticipant, 'Supplier', entity.supplierId);

        const registry = await businessNetworkConnection.getAssetRegistry(fns);
        await registry.add(item);
        return item.entityId;
    }
    catch (err) {
        throw new Error('CreateProduct(): ' + err);
    }
}

async function CreateAProduct(name, campaignId, campaignRequestId, customerId, donationId, donorId, supplierId) {
    try {
        let timeStampNow = new Date();
        let entity = {
            entityId: newid(),
            approvalResponse: "OK",
            approvalStatus: "ACCEPTED",
            createdOn: timeStampNow,
            description: "Approved Advertisement",
            name,
            note: "Adverting link...",
            productStatus: "SUBMITTED",
            campaignId,
            customerId,
            donationId,
            donorId,
            supplierId
        }
        let productId = await CreateProduct(entity);
        return productId;
    }
    catch (err) {
        throw new Error('CreateAProduct(): ' + err);
    }
}

describe('testing utilities', ()=> {
    let customerId1 = "";
    let donorId1 = "";
    let bankAccountId1, bankAccountId2, bankAccountId3, bankAccountId4, bankAccountId5;
    let supplierId1, supplierId2;
    let donationId1 = "";
    let campaignId1 = "";
    let campaignRequestId1, campaignRequestId2, campaignRequestId3, campaignRequestId4;
    let productId1, productId2, productId3, productId4;

    it('create a customer', async() => {
        try {
            customerId1 = await createACustomer(factory, "first-customer");
        }
        catch(err) {
            console.log('create a customer: ', err);
        }
    })

    it('create bankaccounts', async()=> {
        try {
            bankAccountId1 = await createABankAccount(factory);
            bankAccountId2 = await createABankAccount(factory);
            bankAccountId5 = await createABankAccount(factory);
            bankAccountId3 = await createABankAccount(factory);
            bankAccountId4 = await createABankAccount(factory);
        }
        catch(err) {
            console.log('create a bankaccounts: ', err);
        }
    })

    it('create a donor', async() => {
        try {
            donorId1 = await createADonor(factory, "first-donor", customerId1, bankAccountId1);
            let noCustomers = await getCustomerCount(businessNetworkConnection);
            assert.equal(noCustomers, 1, "after donor insertion, the customer count should remain at 1");
            let donor = await getParticipant("Donor", donorId1);
            assert.deepEqual(donor.customer.$identifier, customerId1, "error: mismatched customer in donor")
        }
        catch(err) {
            console.log('create a donor: ', err);
        }
    })

    it('create two suppliers', async()=> {
        try {
            supplierId1 = await createASupplier(factory, "first-supplier", customerId1, bankAccountId2);
            supplierId2 = await createASupplier(factory, "second-supplier", customerId1, bankAccountId5);
        }
        catch(err) {
            console.log('create two suppliers: ', err);
        }
    })

    it('create a donation', async()=> {
        try {
            donationId1 = await createADonation(factory, "first-donation", customerId1, donorId1, bankAccountId3);
        }
        catch(err) {
            console.log('create a donation: ', err);
        }

    })

    it('create a campaign', async()=> {
        try {
            campaignId1 = await CreateACampaign(factory, "first-campaign", customerId1, donorId1, donationId1, bankAccountId4);
        }
        catch(err) {
            console.log('create a campaign: ', err);
        }

    })

    it('create two campaignRequests', async()=> {
        try {
            campaignRequestId1 = await CreateACampaignRequest(factory, "first-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId1);
            let cr = await getObject("CampaignRequest", campaignRequestId1);
            assert.deepEqual(cr.campaign.$identifier, campaignId1, "first-campaign-request campaignId mismatch.");
            assert.deepEqual(cr.customer.$identifier, customerId1, "first-campaign-request customerId mismatch.");
            assert.deepEqual(cr.donation.$identifier, donationId1, "first-campaign-request donationId mismatch.");
            assert.deepEqual(cr.donor.$identifier, donorId1, "first-campaign-request donorId mismatch.");
            assert.deepEqual(cr.supplier.$identifier, supplierId1, "first-campaign-request supplierId mismatch.");
            campaignRequestId2 = await CreateACampaignRequest(factory, "second-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId1);
            campaignRequestId3 = await CreateACampaignRequest(factory, "third-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId2);
            campaignRequestId4 = await CreateACampaignRequest(factory, "fourth-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId2);
        }
        catch(err) {
            console.log('create two campaignRequests: ', err);
        }
    })

    it('create 4 products', async()=> {
        productId1 = CreateAProduct("Product 1", campaignId1, campaignRequestId1, customerId1, donationId1, donorId1, supplierId1);
        productId2 = CreateAProduct("Product 2", campaignId1, campaignRequestId2, customerId1, donationId1, donorId1, supplierId1);
        productId3 = CreateAProduct("Product 3", campaignId1, campaignRequestId3, customerId1, donationId1, donorId1, supplierId2);
        productId4 = CreateAProduct("Product 4", campaignId1, campaignRequestId4, customerId1, donationId1, donorId1, supplierId2);
    })

    it('disable a customer', async () => {
        try {
            const participantId = customerId1;
            if (participantId !== '') {
                const methodName = 'SetParticipantStatus';
                let transaction = factory.newTransaction(NS+'.util', methodName);
                transaction.setPropertyValue('participantId', participantId);
                transaction.setPropertyValue('status', 'INACTIVE');
                transaction.setPropertyValue('entityType', 'Customer');
                await businessNetworkConnection.submitTransaction(transaction);
                let list2 = await businessNetworkConnection.query('SelectAllCustomers');
                if (list2.length <= 0)
                    assert(false, 'no customers in the registry 2');
                assert.equal(list2[0].status, 'INACTIVE');
            }
            else 
                assert(false, 'no customer to test.');
        } catch(err){
            console.log(err);
            assert(false, err);
        }
    })

    async function setParticiapantStatus (participantId, queryOne, entityType, entityStatus){
        if (participantId) {
            const methodName = 'SetParticipantStatus';
            let transaction = factory.newTransaction(NS+'.util', methodName);
            transaction.setPropertyValue('participantId', participantId);
            transaction.setPropertyValue('entityType', entityType);
            transaction.setPropertyValue('status', entityStatus);
            await businessNetworkConnection.submitTransaction(transaction);
            let entity = await businessNetworkConnection.query(queryOne, { participantId });
            if (!entity)
                assert(false, 'no participant in the registry 2');
            else
                assert.equal(entity[0].status, 'INACTIVE');
        }
        else
            assert(false, 'no participant in the registry 1')
    }

    it('disable a donor', async()=> {
        try {
            let customerId = customerId1;
            let participantId = donorId1;
                
            let queryOne = 'SelectADonor';
            let entityType = 'Donor';
            let entityStatus = 'INACTIVE';
            await setParticiapantStatus (participantId, queryOne, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    it('disable a supplier', async()=> {
        try {
            let customerId = customerId1;
            let participantId = supplierId1;
                
            let queryOne = 'SelectASupplier';
            let entityType = 'Supplier';
            let entityStatus = 'INACTIVE';
            await setParticiapantStatus (participantId, queryOne, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    async function setAssetStatus(entityId, queryOne, entityGroup, entityType, entityStatus) {
        if (entityId) {
            const methodName = 'SetAssetStatus';
            let transaction = factory.newTransaction(NS+'.util', methodName);
            transaction.setPropertyValue('entityId', entityId);
            transaction.setPropertyValue('entityGroup', entityGroup);
            transaction.setPropertyValue('entityType', entityType);
            transaction.setPropertyValue('status', entityStatus);
            await businessNetworkConnection.submitTransaction(transaction);
            let entity = await businessNetworkConnection.query(queryOne, { entityId });
            if (!entity)
                assert(false, 'no asset in the registry 1.');
            else
                assert.equal(entity[0].status, entityStatus);
        }
        else
            assert(false, 'no asset in the registry 2.');
    }

    it('disable a bank account', async()=> {
        try {
            let queryOne        = 'SelectABankAccount';
            let entityGroup     = 'util';
            let entityType      = 'BankAccount';
            let entityStatus    = 'INACTIVE';
            await setAssetStatus(bankAccountId2, queryOne, entityGroup, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

})
