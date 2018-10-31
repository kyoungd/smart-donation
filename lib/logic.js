const NS = 'org.acme.smartdonation';
const nsParticipant = NS + '.participant';
const nsObject = NS + '.object';
const nsUtil = NS + '.util';

async function getObject(objectGroup, objectType, entityId) {
    const fns = NS + "." + objectGroup + "." + objectType;
    const registry = await getAssetRegistry(fns);
    let item = await registry.get(entityId);
    return item;
}

async function getParticipant(objectType, entityId) {
    const fns = nsParticipant + "." + objectType;
    const registry = await getParticipantRegistry(fns);
    let item = await registry.get(entityId);
    return item;
}

function newid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.util.SetParticipantStatus} entity
 * @transaction
 */
async function setParticipantStatus(entity) {
    try {
        const namespace = NS + '.participant';
        const fns = namespace + '.' + entity.entityType;
        const registry = await getParticipantRegistry(fns);
        let item = await registry.get(entity.participantId);
        item.status = entity.status;
        await registry.update(item);
    }
    catch (err) {
        throw new Error('setParticipantStatus(): ' + err);
    }
}

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.util.SetAssetStatus} entity
 * @transaction
 */
async function setAssetStatus(entity) {
    try {
        const namespace = NS + '.' + entity.entityGroup;
        const fns = namespace + '.' + entity.entityType;
        const registry = await getAssetRegistry(fns);
        let item = await registry.get(entity.entityId);
        item.status = entity.status;
        await registry.update(item);
    }
    catch (err) {
        throw new Error('setAssetStatus(): ' + err);
    }
}

async function addTransferFund(entityId, campaign) {
    const factory = getFactory();
    let item = factory.newResource(nsObject, 'TransferFund', entityId);
    item.status = "NOT_STARTED";
    item.campaign = campaign;
    item.customer = campaign.customer;
    item.donation = campaign.donation;
    item.donor = campaign.donor;
    const fns = NS + ".object.TransferFund";

    const registry = await getAssetRegistry(fns);
    await registry.add(item);
    return entityId;
}

async function createTransferFund(campaign, campaignRequests, products) {
    try {
        await setAssetStatus({entityId: campaign.entityId, entityGroup: "object", entityType: "Campaign", status: "COMPLETE"});
        await setAssetStatus({entityId: campaign.donation.$identifier, entityGroup: "object", entityType: "Donation", status: "COMPLETE"});
        campaignRequests.forEach(async(item) => {
            await setAssetStatus({entityId: item.entityId, entityGroup: "object", entityType: "CampaignRequest", status: "COMPLETE"});
        });
        products.map(async(item) => {
            await setAssetStatus({entityId: item.entityId, entityGroup: "object", entityType: "Product", status: "COMPLETE"});
        });
    }
    catch(err) {
        throw new Error(" createTransferFund(): ", err);
    }
}

function transferFundCheck(campaign, campaignRequests, products) {
    if (!campaign)
        throw new Error('transferFundToCampaign(). campaign does not exist.');
    if (campaign.status !== "ACTIVE")
        throw new Error('transferFundToCampaign(). campaign status must be active.  The transfer is permitted only once while the status is active.');
    if (!campaignRequests || campaignRequests.length <= 0)
        throw new Error('transferFundToCampaign(). No Campaign request was accepted by supplier');
    if (!products || products.length <= 0)
        throw new Error('transferFundToCampaign(). No products were submitted for approval');
    if (campaignRequests.length !== products.length)
        throw new Error('transferFundToCampaign(). Some products were not approved by the donor.');
}
/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.util.TransferFundToCampaign} entity
 * @transaction
 */
async function transferFundToCampaign(entity) {
    try {
        let campaignId = entity.campaignId;
        let campaign = await getObject("object", "Campaign", campaignId);
        let campaignRequests = await query("SelectTransferFundCampaignRequest", { campaign: campaign.toURI() });
        let products = await query("SelectTransferFundProduct", {campaign: campaign.toURI()});
        transferFundCheck(campaign, campaignRequests, products);
        let entityId = entity.entityId;
        await addTransferFund(entityId, campaign);
        await createTransferFund(campaign, campaignRequests, products);
    }
    catch (err) {
        throw new Error('transferFundToCampaign(): ' + err);
    }
}
