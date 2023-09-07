const {join} = require("path")
const helper = module.exports = {}


helper.protocol = function(value) {
    return (value || "https").replace(/(\:\/+)?$/, "://")
}


helper.api_base = function(environment, protocol) {
    return {
        development: "dev.kneipp.com",
        staging: "stg.kneipp.com",
        production: "kneipp.com"
    }
    [environment || "staging"]
    .replace(/^(\w+\:\/+)?/i, helper.protocol(protocol))
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
