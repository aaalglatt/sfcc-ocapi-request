// This is a demo configuration file. Adjust it to your needs.

const {addAccessKey, ACCESS_KEYS} = require("../credentials")

module.exports = {
    SITE_ID: "businessManagerSiteName",
    CUSTOMER_LIST: "businessManagerCustomerListName",
    ENVIRONMENT: "environmentName", // for example one of ['development', 'staging', 'production']
    DEBUG: false, // number of records or false
    ACCESS_KEYS
}

// Domains of your Salesforce Commerce environments/instances
addEnvironmentDomain("dev.domain.net", "development")
addEnvironmentDomain("stg.domain.net", "staging")
addEnvironmentDomain("domain.net", "production")

addAccessKey( // API Client (same on for all environments)
    "abcdefghijklmnopqrstuvwxyz0987654321", // username
    "Pa$Sword", // password
    "apiclient", // aliases or tags to use as shortcut referecne when fetching this access key from `ACCESS_KEYS[environment][alias]`
    null, // make credentials available for all supported environments
    "OCAPI Test Client", // request agent name
    "https://domain.net" // request agent origin url
)

addAccessKey( // Business Manager User ('staging' environment)
    "user.name@company.at", // username
    "Pa$Sword", // password
    "bmuser", // alias (or multiple: ['bmuser', 'api_client', ...])
    "production" // environment (or multiple: ['development', 'staging', ...])
)

addAccessKey( // Business Manager User ('production' environment)
    "user.name@company.at",
    "Pa$Sword",
    "bmuser",
    "production"
)