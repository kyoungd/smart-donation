const NS = 'org.acme.smartdonation';


async function getObject(objectType, entityId) {
    const fns = nsObject + "." + objectType;
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

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.util.SetParticipantStatus} entity
 * @transaction
 */
async function setParticipantStatus(entity) {
    try {
        const factory = getFactory();
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
        const factory = getFactory();
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

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.util.TransferFundToCampaign} entity
 * @transaction
 */
async function transferFundToCampaign(entity) {
    try {
        const factory = getFactory();
        let campaignId = entity.entityId;
        let campaign = await getObject("Campaign", campaignId);
        if (campaign == null)
            throw new Error('transferFundToCampaign(). campaign does not exist.');
        if (campaign.status !== "ACTIVE")
            throw new Error('transferFundToCampaign(). campaign status must be active.');
        let transferFund = await query("SelectTransferFund", {id: campaignId} );
        if (transferFund !== null || transferFund.length > 0)
            throw new Error('transferFundToCampaign(). Transfer is permitted only once per campaign.');
        let campaignRequests = await query("SelectTransferFundCampaignRequest", { id: campaignId, entityState: "ACTIVE", requestState: "ACCEPTED" });
        if (campaignRequests == nulll || campaignRequests.length <= 0)
            throw new Error('transferFundToCampaign(). No Campaign request was accepted by supplier');
        let products = await query("SelectTransferFundProduct", {id: campaignId, productStatus: "SUBMITTED", approvalStatus: "ACCEPTED"});
        if (products == null || products.length <= 0)
            throw new Error('transferFundToCampaign(). No products were submitted for approval')
        if (campaignRequests.length <= 0 && campaignRequests.length !== products.length)
    }
    catch (err) {
        throw new Error('transferFundToCampaign(): ' + err);
    }
}
