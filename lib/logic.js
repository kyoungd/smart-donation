const NS = 'org.acme.smartdonation';

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
 * @param {org.acme.smartdonation.participant.CreateCustomer} entity
 * @transaction
 */
async function createCustomer(entity) {
    try {
        const factory = getFactory();
        let customerId = newid();
        let namespace = NS + '.participant';
        let access = factory.newConcept(namespace, 'RoleAccess');
        access.isRead = entity.isRead;
        access.isWrite = entity.isWrite;
        access.isAccountOnly = entity.isAccountOnly;
        access.isDepartmentOnly = entity.isDepartmentOnly;
        access.isAll = entity.isAll;
        let customer1 = factory.newResource(namespace, 'Customer', customerId);
        customer1.participantId = customerId;
        customer1.phoneNumber = entity.phoneNumber;
        customer1.email = entity.email;
        customer1.note = entity.note;
        customer1.access = access;
        customer1.status = entity.status;
        customer1.name = entity.name;

        let fns = namespace + '.Customer';
        const registry = await getParticipantRegistry(fns);
        await registry.add(customer1);
    }
    catch (err) {
        throw new Error('CreateCustomer(): ' + err);
    }
}

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.participant.SetParticipantStatus} entity
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
        throw new Error('CreateCustomer(): ' + err);
    }
}

/**
 * Create a new customer - only network admin can run this command.
 * @param {org.acme.smartdonation.participant.CreateDonor} entity
 * @transaction
 */
async function createDonor(entity) {
    try {
        const factory = getFactory();
        let customerId = newid();
        let namespace = NS + '.participant';
        let fns = namespace + '.Donor';
        let access = factory.newConcept(namespace, 'RoleAccess');
        access.isRead = entity.isRead;
        access.isWrite = entity.isWrite;
        access.isAccountOnly = entity.isAccountOnly;
        access.isDepartmentOnly = entity.isDepartmentOnly;
        access.isAll = entity.isAll;
        let donor1 = factory.newResource(namespace, 'Donor', customerId);
        donor1.participantId = customerId;
        donor1.phoneNumber = entity.phoneNumber;
        donor1.email = entity.email;
        donor1.note = entity.note;
        donor1.access = access;
        donor1.status = entity.status;
        donor1.name = entity.name;
        donor1.customer = factory.newRelationship(namespace, 'Customer', entity.customerId);
        const registry = await getParticipantRegistry(fns);
        await registry.add(donor1);
    }
    catch (err) {
        throw new Error('CreateCustomer(): ' + err);
    }
}

/**
 * Create a new bank account - only network admin can run this command.
 * @param {org.acme.smartdonation.bankaccounts.CreateBankAccount} entity
 * @transaction
 */
async function createBankAccount(entity) {
    try {
        const factory = getFactory();
        let bankAccountId = newid();
        let namespace = NS + '.bankaccounts';
        let fns = namespace + '.BankAccount';
        let bankAccount = factory.newResource(namespace, 'BankAccount', bankAccountId);
        bankAccount.entityId = bankAccountId;
        bankAccount.accountNumber = entity.accountNumber;
        bankAccount.routingNumber = entity.routingNumber;
        bankAccount.status = entity.status;
        bankAccount.note = entity.note;
        bankAccount.createdOn = entity.createdOn;
        const registry = await getAssetRegistry(fns);
        await registry.add(bankAccount);
    }
    catch (err) {
        throw new Error('CreateCustomer(): ' + err);
    }
}

