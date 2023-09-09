const {request} = require("../public")
const {DEBUG, ACCESS_KEYS, ENVIRONMENT} = require("./private-settings")

const findProductInventory = function(product, inventory = "inventory-DEAT", environment = "staging") {
    return request[environment].data(
        "GET", // request method
        `/inventory_lists/${inventory}/product_inventory_records/${product}`, // api endpoint path
        undefined, // site id
        undefined, // OCAPI version
        undefined, // request body payload
        undefined, // request query parameters
        undefined, // request headers
        "Test Client", // name for the user agent request header
        "https://microservices.kneipp.de", // url for the origin request header
        undefined // count of re-tries for the request timeout
    )
}

!async function() {
    //console.log(ACCESS_KEYS)
    const results = await findProductInventory("912971", "inventory-FR", ENVIRONMENT)
    console.log(results)
}()

