const grantBusinessManagerUser = require("./user-grant")
const grantApiClient = require("./client-grant")

module.exports = async function(environment) {
    try {
        const response = await grantBusinessManagerUser(environment)
        return response
    } catch(exception) {
        console.error(`Salesforce Business Manager User authorization method failed!`, exception)
    }

    try {
        const response = await grantApiClient(environment)
        return response
    } catch(exception) {
        console.error(`Salesforce API Client authorization method failed!`, exception)
    }

    throw new Error(`Salesforce authorization failed!`)
}
