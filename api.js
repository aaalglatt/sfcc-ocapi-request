const {merge} = require("merge-anything")
const {api_url, sleep} = require("./helper")
const request = require("./rest")
const authenticate = require("./auth")
const {ACCESS_KEYS, SUPPORTED_ENVIRONTMENTS} = require("./credentials")

let CONNECTION = null
const RETRY_COUNT = 3 // try to reconnect this many times

module.exports = {
    fetch: async function(method, url, payload, query, headers, environment, attempts = RETRY_COUNT) { // export raw http request method (eg. useful on paginated requests with `response.next`)
        try {
            if(CONNECTION === null || Date.now() - CONNECTION.expires_at >= -10000) { // current session expired (session renewal 10 seconds before its real expiry timestamp)
                CONNECTION = await authenticate(environment)
            }
    
            const {username: client_id, agent: client_agent, origin: client_origin} = ACCESS_KEYS[environment].apiclient

            const response = await request(
                method, // request method
                url, // request url
                payload, // body payload
                query, // query parameters
                merge( // request headers
                    headers || {},
                    { // IMPORTANT: Always override these headers!
                        "x-dw-client-id": client_id,
                        "User-Agent": client_agent,
                        "Origin": client_origin, // https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FOCAPI%2Fcurrent%2Fusage%2FOCAPISettings.html
                        "Authorization": `${CONNECTION.token_type || "Bearer"} ${CONNECTION.access_token}`
                    }
                ),
                environment
            )
    
            if(typeof response !== "object" || response === null) {
                throw new Error(`Request to '${method.toUpperCase()} ${url}' received no response!`)
            }
    
            if(typeof response.fault === "object" && response.fault !== null) {
                if(response.fault.type === "InvalidAccessTokenException" && attempts > 0) { // re-try client authentication and request
                    if(attempts < RETRY_COUNT) {
                        await sleep(1)
                    }

                    attempts--
                    console.log(`Salesforce OCAPI request to ${method.toUpperCase()} ${url} was unauthorized! Trying to (re-)authenticate the client (attempt ${RETRY_COUNT - attempts}/${RETRY_COUNT})...`)

                    return module.exports.fetch(
                        method,
                        url,
                        payload,
                        query,
                        headers,
                        environment,
                        attempts
                    )
                }
                throw new Error(response.fault.message)
            }
    
            return response
    
        } catch(error) {
            throw new Error(`Salesforce OCAPI request to ${method.toUpperCase()} ${url} failed with message: ${error}`)
        }
    }
}

for(const supported_environment of SUPPORTED_ENVIRONTMENTS) { // generate hierarchy of shortcut request methods
    module.exports[supported_environment] = {}
    for(const api_realm of ["data", "shop"]) {
        module.exports[supported_environment][api_realm] = function(method, path, site_id, api_version, payload, query, headers, attempts) { // wrapped request call with improved list of arguments for OCAPI usage
            return module.exports.fetch(
                method,
                api_url(supported_environment, site_id, api_realm, api_version, path),
                payload,
                query,
                headers,
                supported_environment,
                attempts
            )
        }
    }
}
