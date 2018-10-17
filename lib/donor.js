function newid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
  
/**
 * Create a new donor
 * @param {org.acme.smartdonation.donors.CreateDonor} new Donor - the ReadyForPayment transaction
 * @transaction
 */
function createDonor (newDonor) {
    const factory = getFactory();
    var donorId = newid();
    var NS = 'org.acme.smartdonation.donors';
    var assetName = 'Donor';
    var person = factory.newResource(NS,assetName,donorId);

    person.donorId = donorId;
    person.name = newDonor.name;
    person.phoneNumber = newDonor.phoneNumber;
    person.emailAddress = newDonor.emailAddress;
    person.createdOn = new Date();

    // set the new owner of the commodity
    return getAssetRegistry(NS + '.Donor')
        .then(assetRegistry => {
            let eventNotification = getFactory().newEvent(NS, 'NotificationCreateDonor');
            eventNotification.donorId = donorId;
            eventNotification.name = newDonor.name;
            emit(eventNotification);
        
            return assetRegistry.add(person);
        }).then(()=> {
            console.log('@debug - Donor created: ', newDonor.name, '  ' + donorId);
        }).catch(err => {
            throw new Error(err);
        })

    // emit a notification that a new donor is created
}

// function createDonor (newDonor) {
//     return m_createDonor(newDonor).then(()=> {}).catch(err=> {throw new Error("craeteDonor: " + err); });
// }

// async function m_createDonor (newDonor) {
//     var donorId = 'xxxx-xxxx-xxxx';
//     var NS = 'org.acme.smartdonation.donors';
//     var assetName = 'Donor';
//     var person = factory.newResource(NS,assetName,donorId);


//     person.donorId = donorId;
//     person.name = newDonor.name;
//     person.phoneNumber = newDonor.phoneNumber;
//     person.emailAddress = newDonor.emailAddress;
//     person.createdOn = new Date();

//     // set the new owner of the commodity
//         let assetRegistry = await getAssetRegistry(NS + '.Donor');

//     // emit a notification that a new donor is created
//     let eventNotification = getFactory().newEvent(NS, 'NotificationCreateDonor');
//     eventNotification.donorId = donorId;
//     eventNotification.name = newDonor.name;
//     emit(eventNotification);

//     await assetRegistry.add(person);
// }
