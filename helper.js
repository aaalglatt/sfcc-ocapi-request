const {ENVIRONMENT_DOMAINS, SUPPORTED_ENVIRONTMENTS, getSupportedEnvironment} = require("./credentials")
const {join} = require("path")
const helper = module.exports = {}


helper.protocol = function(value) {
    return (value || "https").replace(/(\:\/+)?$/, "://")
}


helper.api_base = function(environment, protocol) {
    let environment_fallback = false
    let supported_environment = "staging" // default fallback environment
    try {
        supported_environment = getSupportedEnvironment(environment) // normalize the writing style because "dev" can be used to refer/match the "development" environment
    } catch(_) {
        environment_fallback = true
    }
    const base_url = ENVIRONMENT_DOMAINS[supported_environment].replace(/^(\w+\:\/+)?/i, helper.protocol(protocol))
    if(environment_fallback === true) {
        console.warn(`The Base URL ${JSON.stringify(base_url)} was compiled for the ${JSON.stringify(environment)} environment (a fallback) because the ${JSON.stringify(environment)} environment could not be found among supported environments ${JSON.stringify(SUPPORTED_ENVIRONTMENTS)}!`)
    }
    return base_url
}


helper.api_scope = function(site) {
    return site !== null
        ? "/s/" + (site || "-") // NOTE: '-' means organization-wide request (not site-specific)
        : ""
}


helper.api_realm = function(type, version) {
    return `/dw/${type}/${version || "v23_1"}`
}


helper.api_url = function(environment, site, api_realm, api_version, endpoint) {
    return helper.api_base(environment) + join(
        helper.api_scope(site),
        helper.api_realm(api_realm, api_version),
        endpoint.replace(/[\\\/]+$/, "") // remove trailing slashes
    )
}


helper.sleep = function(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000)
    })
}
