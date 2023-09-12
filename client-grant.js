// This method uses only the API client for authentication and works only with the Shop API.

const {ACCESS_KEYS} = require("./credentials")
const request = require("./rest")

module.exports = async function api_client_grant(environment) {
    const {username: client_id, password: client_password, agent: client_agent, origin: client_origin} = ACCESS_KEYS[environment].apiclient

    try {
        let response = await request( // request new access_token
            "POST", // request method
            "https://account.demandware.com/dwsso/oauth2/access_token", // endpoint url
            "grant_type=client_credentials", // url-encoded request body payload
            undefined, // url querystring parameters
            { // request headers
                "x-dw-client-id": client_id,
                "Authorization": "Basic " + new Buffer.from(client_id + ":" + client_password).toString("Base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            environment
        )

        if(typeof response !== "object" || response === null || typeof response.access_token !== "string"){
            throw new Error(`Salesforce OCAPI authentication has failed (${response.error}) for client '${client_id}'! ${response.error_description}`)
        }

        if(response.expires_in <= 0) {
            throw new Error("Salesforce OCAPI authentication is missing an expiry timeout!")
        }
        
        console.log(`Salesforce OCAPI client '${client_id}' has been authenticated successfully with '${response.token_type || "Bearer"}' token '${response.access_token}'.`)

        response.expires_at = Date.now() + response.expires_in * 1000 // milliseconds
        
        return response
    } catch(exception) {
        throw exception
    }
}
