// This method uses the Business Manager user and the API client user for authentication and works with Data and Shop APIs.
// NOTE: Business Manager Access Keys expire after 180 days!

const request = require("./rest")
const {api_base} = require("./helper")
const {ACCESS_KEYS} = require("./credentials")

module.exports = async function business_manager_user_grant(environment) {
    const {username: client_id, password: client_password, agent: client_agent, origin: client_origin} = ACCESS_KEYS[environment].apiclient
    const {username: user_id, password: user_password} = ACCESS_KEYS[environment].bmuser

    try {
        let response = await request( // request new access_token
            "POST", // request method
            api_base(environment) + "/dw/oauth2/access_token", // endpoint url
            "grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken", // url-encoded request body payload
            { // url querystring parameters
                client_id
            },
            { // request headers
                "x-dw-client-id": client_id,
                "User-Agent": client_agent,
                "Origin": client_origin,
                "Authorization": "Basic " + new Buffer.from(user_id + ":" + user_password + ":" + client_password).toString("Base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            environment
        )

        if(typeof response !== "object" || response === null || typeof response.access_token !== "string"){
            throw new Error(`Salesforce OCAPI authentication has failed (${response.error}) for client '${client_id}' (user account '${user_id}')! ${response.error_description}`)
        }

        if(response.expires_in <= 0) {
            throw new Error("Salesforce OCAPI authentication is missing an expiry timeout!")
        }

        console.log(`Salesforce OCAPI client '${client_id}' (user account '${user_id}') has been authenticated successfully with '${response.token_type || "Bearer"}' token '${response.access_token}'.`)

        response.expires_at = Date.now() + response.expires_in * 1000 // milliseconds

        return response
    } catch(exception) {
        throw exception
    }
}
