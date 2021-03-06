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

let customerId1 = "";
let donorId1 = "";
let bankAccountId1, bankAccountId2, bankAccountId3, bankAccountId4, bankAccountId5, bankAccountId6, bankAccountId7;
let supplierId1, supplierId2, supplierId3, supplierId4;
let donationId1 = "";
let campaignId1 = "";
let campaignRequestId1, campaignRequestId2, campaignRequestId3, campaignRequestId4;
let productId1, productId2, productId3, productId4;
let transferFundId1;
let bankAccountId21, bankAccountId22, bankAccountId23, bankAccountId24, bankAccountId25, bankAccountId26, bankAccountId27;
let supplierId21, supplierId22, supplierId23, supplierId24;
let donationId21 = "";
let campaignId21 = "";
let campaignRequestId21, campaignRequestId22, campaignRequestId23, campaignRequestId24;
let productId21, productId22, productId23, productId24;

async function getObject(objectGroup, objectType, entityId) {
    const fns = NS + "." + objectGroup + "." + objectType;
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


describe('testing utilities', ()=> {

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
    
    async function getParticipantCount(objectType) {
        const fns = nsParticipant + "." + objectType;
        const registry = await businessNetworkConnection.getParticipantRegistry(fns);
        let item = await registry.getAll();
        return item.length;
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
            requestStatus: "SUBMITTED",
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
            item.status = entity.status;
            item.campaign = factory.newRelationship(nsObject, 'Campaign', entity.campaignId);
            item.campaignRequest = factory.newRelationship(nsObject, 'CampaignRequest', entity.campaignRequestId);
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
                status: "ACTIVE",
                campaignId,
                campaignRequestId,
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
            bankAccountId6 = await createABankAccount(factory);
            bankAccountId7 = await createABankAccount(factory);
        }
        catch(err) {
            console.log('create a bankaccounts: ', err);
        }
    })

    it('create a donor', async() => {
        try {
            donorId1 = await createADonor(factory, "first-donor", customerId1, bankAccountId1);
            let noCustomers = await getParticipantCount("Customer");
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
            supplierId3 = await createASupplier(factory, "third-supplier", customerId1, bankAccountId6);
            supplierId4 = await createASupplier(factory, "fourth-supplier", customerId1, bankAccountId7);
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
            let cr = await getObject("object", "CampaignRequest", campaignRequestId1);
            assert.deepEqual(cr.campaign.$identifier, campaignId1, "first-campaign-request campaignId mismatch.");
            assert.deepEqual(cr.customer.$identifier, customerId1, "first-campaign-request customerId mismatch.");
            assert.deepEqual(cr.donation.$identifier, donationId1, "first-campaign-request donationId mismatch.");
            assert.deepEqual(cr.donor.$identifier, donorId1, "first-campaign-request donorId mismatch.");
            assert.deepEqual(cr.supplier.$identifier, supplierId1, "first-campaign-request supplierId mismatch.");
            campaignRequestId2 = await CreateACampaignRequest(factory, "second-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId2);
            campaignRequestId3 = await CreateACampaignRequest(factory, "third-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId3);
            campaignRequestId4 = await CreateACampaignRequest(factory, "fourth-campaign-request", 
                campaignId1, customerId1, donationId1, donorId1, supplierId4);
        }
        catch(err) {
            console.log('create two campaignRequests: ', err);
        }
    })

    it('create 4 products', async()=> {
        productId1 = await CreateAProduct("Product 1", campaignId1, campaignRequestId1, customerId1, donationId1, donorId1, supplierId1);
        productId2 = await CreateAProduct("Product 2", campaignId1, campaignRequestId2, customerId1, donationId1, donorId1, supplierId2);
        productId3 = await CreateAProduct("Product 3", campaignId1, campaignRequestId3, customerId1, donationId1, donorId1, supplierId3);
        productId4 = await CreateAProduct("Product 4", campaignId1, campaignRequestId4, customerId1, donationId1, donorId1, supplierId4);
    })

    it('do transfer fund', async() => {
        transferFundId1 = newid();
        const methodName = 'TransferFundToCampaign';
        let transaction = factory.newTransaction(nsUtil, methodName);
        transaction.setPropertyValue("entityId", transferFundId1);
        transaction.setPropertyValue("campaignId", campaignId1);
        await businessNetworkConnection.submitTransaction(transaction);

        let item = await getObject("object", "TransferFund", transferFundId1);
        assert.equal(transferFundId1, item.entityId, "no TransferFund entry in the registry");

//        let list2 = await businessNetworkConnection.query('SelectAllTransferFunds');
        // if (list2.length <= 0)
        //     assert(false, 'no TransferFund entry in the registry');
        // assert.equal(list2[0].status, 'NOT_STARTED');
    })

    async function setParticiapantStatus (participantId, queryOne, entityType, entityStatus){
        if (participantId) {
            const methodName = 'SetParticipantStatus';
            let transaction = factory.newTransaction(NS+'.util', methodName);
            transaction.setPropertyValue('participantId', participantId);
            transaction.setPropertyValue('entityType', entityType);
            transaction.setPropertyValue('status', entityStatus);
            await businessNetworkConnection.submitTransaction(transaction);
            let entity = await getParticipant(entityType, participantId);
            // let entity = await businessNetworkConnection.query(queryOne, { participantId });
            if (!entity)
                assert(false, 'no participant in the registry 2');
            else
                assert.equal(entity.status, entityStatus);
        }
        else
            assert(false, 'no participant in the registry 1')
    }

    async function setAssetStatus(entityId, queryOne, entityGroup, entityType, entityStatus) {
        if (entityId) {
            const methodName = 'SetAssetStatus';
            let transaction = factory.newTransaction(NS+'.util', methodName);
            transaction.setPropertyValue('entityId', entityId);
            transaction.setPropertyValue('entityGroup', entityGroup);
            transaction.setPropertyValue('entityType', entityType);
            transaction.setPropertyValue('status', entityStatus);
            await businessNetworkConnection.submitTransaction(transaction);
            let entity = await getObject(entityGroup, entityType, entityId);
            if (!entity)
                assert(false, 'no asset in the registry 1.');
            else
                assert.equal(entity.status, entityStatus);
        }
        else
            assert(false, 'no asset in the registry 2.');
    }

    it.skip('disable a customer', async () => {
        try {
            let participantId = customerId1;

            let queryOne = '';
            let entityType = 'Customer';
            let entityStatus = 'SUSPENDED';
            await setParticiapantStatus (participantId, queryOne, entityType, entityStatus);
        } catch(err){
            console.log(err);
            assert(false, err);
        }
    })

    it.skip('disable a donor', async()=> {
        try {
            let participantId = donorId1;

            let queryOne = '';
            let entityType = 'Donor';
            let entityStatus = 'SUSPENDED';
            await setParticiapantStatus (participantId, queryOne, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    it.skip('disable a supplier', async()=> {
        try {
            let customerId = customerId1;
            let participantId = supplierId1;
                
            let queryOne = '';
            let entityType = 'Supplier';
            let entityStatus = 'SUSPENDED';
            await setParticiapantStatus (participantId, queryOne, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    it.skip('disable a Bank Account', async()=> {
        try {
            let queryOne        = 'SelectABankAccount';
            let entityGroup     = 'util';
            let entityType      = 'BankAccount';
            let entityStatus    = 'SUSPENDED';
            await setAssetStatus(bankAccountId2, queryOne, entityGroup, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    it.skip('disable a Campaign', async()=> {
        try {
            let queryOne        = '';
            let entityGroup     = 'object';
            let entityType      = 'Campaign';
            let entityStatus    = 'SUSPENDED';
            await setAssetStatus(campaignId1, queryOne, entityGroup, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });

    it.skip('disable a Product', async()=> {
        try {
            let queryOne        = '';
            let entityGroup     = 'object';
            let entityType      = 'Product';
            let entityStatus    = 'SUSPENDED';
            await setAssetStatus(productId1, queryOne, entityGroup, entityType, entityStatus);
        }
        catch(err){
            console.log(err);
            assert(false, err);
        }
    });
        
    it('create additional campaign and data', async()=> {
        try {
            bankAccountId21 = await createABankAccount(factory);
            bankAccountId22 = await createABankAccount(factory);
            bankAccountId25 = await createABankAccount(factory);
            bankAccountId23 = await createABankAccount(factory);
            bankAccountId24 = await createABankAccount(factory);
            bankAccountId26 = await createABankAccount(factory);
            bankAccountId27 = await createABankAccount(factory);

            supplierId21 = await createASupplier(factory, "first-supplier", customerId1, bankAccountId22);
            supplierId22 = await createASupplier(factory, "second-supplier", customerId1, bankAccountId25);
            supplierId23 = await createASupplier(factory, "third-supplier", customerId1, bankAccountId26);
            supplierId24 = await createASupplier(factory, "fourth-supplier", customerId1, bankAccountId27);

            donationId21 = await createADonation(factory, "second-donation", customerId1, donorId1, bankAccountId23);

            campaignId21 = await CreateACampaign(factory, "second-campaign", customerId1, donorId1, donationId21, bankAccountId24);

            campaignRequestId21 = await CreateACampaignRequest(factory, "first-campaign-request", 
                campaignId21, customerId1, donationId21, donorId1, supplierId21);
            campaignRequestId22 = await CreateACampaignRequest(factory, "second-campaign-request", 
                campaignId21, customerId1, donationId21, donorId1, supplierId22);
            campaignRequestId23 = await CreateACampaignRequest(factory, "third-campaign-request", 
                campaignId21, customerId1, donationId21, donorId1, supplierId23);
            campaignRequestId24 = await CreateACampaignRequest(factory, "fourth-campaign-request", 
                campaignId21, customerId1, donationId21, donorId1, supplierId24);

            productId21 = await CreateAProduct("Product 1", campaignId21, campaignRequestId21, customerId1, donationId21, donorId1, supplierId21);
            productId22 = await CreateAProduct("Product 2", campaignId21, campaignRequestId22, customerId1, donationId21, donorId1, supplierId22);
            }
        catch(err) {
            console.log('create two campaignRequests: ', err);
        }
    })

});

describe('testing queries', ()=> {

    const getItemSummary = (group, items, type) => {
        let summary = {
            count: 0,
            accepted: 0,
            rejected: 0,
            canceled: 0,
        }

        summary.count = items.reduce((count, p) => group.entityId == p[type].$identifier ? count+1 : count, 0);
        summary.accepted = items.reduce((count, p)=> group.entityId == p[type].$identifier && p.approvalStatus == "ACCEPTED" ? count+1 : count, 0);
        summary.rejected = items.reduce((count, p)=> group.entityId == p[type].$identifier && p.approvalStatus == "REJECTED" ? count+1 : count, 0);
        summary.canceled = items.reduce((count, p)=> group.entityId == p[type].$identifier && p.approvalStatus == "CANCELED" ? count+1 : count, 0);
        return summary;
    }

    const getSummary = (productSummary, crSummary) => {
        let data = {
            total: crSummary.count - crSummary.canceled,
            accepted: productSummary.accepted,
            rejected: productSummary.rejected,
            waiting: crSummary.count - crSummary.canceled - productSummary.accepted - productSummary.rejected,
        }
        return data;
    }

    it ('query donor campaign', async () => {
        try {
            /*
                enum ApprovalState {
                o NOT_SUBMITTED   // Campaign request is not submitted
                o SUBMITTED       // Campaign request was issued to the supplier, and waiting for a response.
                o CANCELED        // Immutable.  Asset operation was cancelled
                o CONSIDERING     // The supplier have read the request, and it is considering it.
                o ACCEPTED        // Immutable.  The request was accepted.
                o REJECTED        // Immutable.  The request was rejected.
                }
            */
            let donor = await getParticipant("Donor", donorId1);
            let donations = await businessNetworkConnection.query("Donor_GetDonation", { donor: donor.toURI() });
            let products = await businessNetworkConnection.query("Donor_GetProduct", { donor: donor.toURI() });
            let campaignRequests = await businessNetworkConnection.query("Donor_GetCampaignRequest", { donor: donor.toURI() });
            let result = [];
            donations.map(d => {
                let productSummary = getItemSummary(d, products, "donation");
                let crSummary = getItemSummary(d, campaignRequests, "donation");
                let data = getSummary(productSummary, crSummary);
                let item = {
                    entityId: d.entityId,
                    name: d.name,
                    description: d.description,
                    rules: d.rules,
                    note: d.note,
                    donateOn: d.donateOn,
                    amount: d.amount,
                    availableOn: d.availableOn,
                    expirationOn: d.expirationOn,
                    status: d.status,
                    isExpired: d.isExpired,
                    isDonationLeft: d.isDonationLeft,
                    isDonationSuccess: d.isDonationSuccess,
                    isDonationPartialSuccess: d.isDonationPartialSuccess,
                    isDonationReturned: d.isDonationReturned,
                    isDonationReturnMust: d.isDonationReturnMust,
                    total: data.total,
                    accepted: data.accepted,
                    rejected: data.rejected,
                    waiting: data.waiting,
                }
                result.push(item);
            });
            let resultJson = JSON.stringify(result, null, 4);
            assert.exists(resultJson, "query donor campaign - assert.exists failed");
        } catch(err){
            assert(false, err);
        }
    })

    it ('query donor approval', async () => {
        try {
            let donor = await getParticipant("Donor", donorId1);
            let donations = await businessNetworkConnection.query("Donor_GetDonation", { donor: donor.toURI() });
            let products = await businessNetworkConnection.query("Donor_GetProduct", { donor: donor.toURI() });
            let result = [];
            products.map(p => {
                let arrayD = donations.filter(d => d.entityId == p.donation.$identifier);
                let donation = arrayD && arrayD.length == 1 ? arrayD[0] : null;
                let item = {
                    donationName: donation.name,
                    donationDescription: donation.description,
                    donationStatus: donation.status,
                    entityId: p.entityId,
                    approvalResponse: p.approvalResponse,
                    approvalStatus: p.approvalStatus,
                    createdOn: p.createdOn,
                    description: p.description,
                    name: p.name,
                    note: p.note,
                    status: p.status,
                    submittedForApprovalOn: p.submittedForApprovalOn,
                }
                result.push(item);
            })
            let resultJson = JSON.stringify(result, null, 4);
            assert.exists(resultJson);
        } catch (err) {
            assert(false, 'query customer campaign information - ' + err);
        }
    })

    it ('query customer campaign information', async() => {
        try {
            let customer = await getParticipant("Customer", customerId1);
            let campaigns = await businessNetworkConnection.query("Customer_GetCampaign", { customer: customer.toURI() });
            let campaignRequests = await businessNetworkConnection.query("Customer_GetCampaignRequest", { customer: customer.toURI() });
            let products = await businessNetworkConnection.query("Customer_GetProduct", { customer: customer.toURI() });
            let donations = await businessNetworkConnection.query("Customer_GetDonation", { customer: customer.toURI() });
            let suppliers = await businessNetworkConnection.query("Customer_GetSupplier", { customer: customer.toURI() });
            let result = [];
            campaigns.map((c)=> {
                let productSummary = getItemSummary(c, products, "campaign");
                let crSummary = getItemSummary(c, campaignRequests, "campaign");
                let data = getSummary(productSummary, crSummary);
                // item for campaign-result per campaign
                let arrayD = donations.filter(dn => dn.entityId == c.donation.$identifier);
                let donation = arrayD && arrayD.length == 1 ? arrayD[0] : null;
                let crs = [];
                campaignRequests.filter(cr => cr.campaign.$identifier == c.entityId).map((cr) => {
                    let arrayS = suppliers.filter(s => s.participantId == cr.supplier.$identifier);
                    let supplier = arrayS && arrayS.length == 1 ? arrayS[0] : null;
                    let item = {
                        entityId: cr.entityId,
                        amount: cr.amount,
                        createdOn: cr.createdOn,
                        description: cr.description,
                        name: cr.name,
                        requestStatus: cr.requestStatus,
                        requestStatusReason: cr.requestStatusReason,
                        respondedOn: cr.respondedOn,
                        status: cr.status,
                        supplier: supplier.name,
                    }
                    crs.push(item);
                })
                let item = {
                    entityId: c.entityId,
                    name: c.name,
                    description: c.description,
                    status: c.status,
                    amount: c.amount,
                    createdOn: c.createdOn,
                    donation : donation.name,
                    donationAmount: donation.amount,
                    total: data.total,
                    accepted: data.accepted,
                    rejected: data.rejected,
                    waiting: data.waiting,
                    campaignRequests: crs,
                }
                result.push(item);
            })
            let resultJson = JSON.stringify(result, null, 4);
            assert.exists(resultJson);
        } catch (err) {
            assert(false, 'query customer campaign information - ' + err);
        }
    })

    it ('query customer campaign production information', async() => {
        try {
            let customer = await getParticipant("Customer", customerId1);
            let campaigns = await businessNetworkConnection.query("Customer_GetCampaign", { customer: customer.toURI() });
            let campaignRequests = await businessNetworkConnection.query("Customer_GetCampaignRequest", { customer: customer.toURI() });
            let products = await businessNetworkConnection.query("Customer_GetProduct", { customer: customer.toURI() });
            let donations = await businessNetworkConnection.query("Customer_GetDonation", { customer: customer.toURI() });
            let suppliers = await businessNetworkConnection.query("Customer_GetSupplier", { customer: customer.toURI() });
            let result = [];
            campaignRequests.map(request => {
                let arrayC = campaigns.filter(c=> c.entityId == request.campaign.$identifier);
                let campaign = arrayC && arrayC.length == 1 ? arrayC[0] : null;
                let arrayS = suppliers.filter(s => s.participantId == request.supplier.$identifier);
                let supplier = arrayS && arrayS.length == 1 ? arrayS[0] : null;
                let arrayD = donations.filter(d => d.entityId == request.donation.$identifier);
                let donation = arrayD && arrayD.length == 1 ? arrayD[0] : null;
                let arrayP = products.filter(p => p.campaignRequest.$identifier == request.entityId);
                let product = arrayP && arrayP.length == 1 ? arrayP[0] : null;
                let item = {
                    entityId: request.entityId,
                    amount: request.amount,
                    createdOn: request.createdOn,
                    description: request.description,
                    campaign: campaign.name,
                    campaigRequest: request.name,
                    requestStatus: request.requestStatus,
                    requestStatusReason: request.requestStatusReason,
                    respondedOn: request.respondedOn,
                    donation: donation.name,
                    supplier: supplier.name,
                    approvalResponse: product ? product.approvalResponse : "-",
                    approvalStatus: product ? product.approvalStatus : "-",
                    productDescription: product ? product.description : "-",
                    productNote: product ? product.note : "-",
                    productStatus: product ? product.status : "-",
                    submittedForApprovalOn: product ? product.submittedForApprovalOn : null,
                }
                result.push(item);
            })
            let resultJson = JSON.stringify(result, null, 4);
            assert.exists(resultJson);
        } catch (err) {
            assert(false, 'query customer campaign production information - ' + err);
        }
    })

    async function querySupplierCampaign (supplierId) {
        let supplier = await getParticipant("Supplier", supplierId);
        let products = await businessNetworkConnection.query("Supplier_GetProduct", { supplier: supplier.toURI() });
        let campaignRequests = await businessNetworkConnection.query("Supplier_GetCampaignRequest", { supplier: supplier.toURI() });
        let result = [];
        campaignRequests.map(request => {
            let arrayP = products.filter(p => p.campaignRequest.$identifier == request.entityId);
            let product = arrayP && arrayP.length == 1 ? arrayP[0] : null;
            let item = {
                entityId: request.entityId,
                amount: request.amount,
                createdOn: request.createdOn,
                description: request.description,
                campaigRequest: request.name,
                requestStatus: request.requestStatus,
                requestStatusReason: request.requestStatusReason,
                respondedOn: request.respondedOn,
                approvalResponse: product ? product.approvalResponse : "-",
                approvalStatus: product ? product.approvalStatus : "-",
                productDescription: product ? product.description : "-",
                productNote: product ? product.note : "-",
                productStatus: product ? product.status : "-",
                submittedForApprovalOn: product ? product.submittedForApprovalOn : null,
            }
            result.push(item);
        })
        let resultJson = JSON.stringify(result, null, 4);
        return resultJson;
    }

    it ('query supplier campaign - product exist', async () => {
        try {
            let resultJson = await querySupplierCampaign(supplierId1);
            assert.exists(resultJson, "query supplier campaign - assert.exists failed");
        } catch(err){
            assert(false, err);
        }
    })

    it ('query supplier campaign - product not exist 1', async () => {
        try {
            let resultJson = await querySupplierCampaign(supplierId23);
            assert.exists(resultJson, "query supplier campaign - assert.exists failed");
            assert.equal(resultJson.approvalResponse, "-");
            assert.equal(resultJson.reqeustStatus, "SUBMITTED");
        } catch(err){
            assert(false, err);
        }
    })
    
});
