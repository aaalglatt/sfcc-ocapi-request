const request = require("../api")
const pageloop = require("../pageloop")
const {DEBUG, ACCESS_KEYS, ENVIRONMENT, CUSTOMER_LIST} = require("./private-settings")

const is_customer_id = value => typeof value === "string" && value.match(/\p{L}+/gui) // eg. bcsSjJvIqOajTOsAX62H7Zo3xA
const is_customer_no = value => typeof value === "string" && value.match(/^\d+$/g) // eg. 0050891916

const getCustomersList = /*async*/ function(environment, list_id, customer/*optional*/, page_items = 100, page_start = 0) {
    try {
        if(is_customer_no(customer)) {
            return request[environment].data(
                "GET", // request method
                `/customer_lists/${list_id}/customers/${customer}`, // api endpoint url
                "-", // organization scope (site)
                undefined, // ocapi version
                undefined // body payload
            )
        }
        return request[environment].data(
            "POST", // request method
            `/customer_lists/${list_id}/customer_search`, // api endpoint url
            "-", // organization or site id
            undefined, // ocapi version
            { // body payload
                query: {
                    match_all_query: {}
                },
                select: "(**)",
                expand: [],
                count: page_items,
                start: page_start
            }
        )
    } catch(error) {
        if(is_customer_id(customer) || is_customer_no(customer)) {
            console.error(`Failed fetching member '${customer}' from customer list '${list_id}'!`, error)
        } else {
            console.error(`Failed fetching members from customer list '${list_id}'!`, error)
        }
    }
}

!async function() {
    //console.log(ACCESS_KEYS)

    let curr_page = 0

    for await(const response of pageloop(getCustomersList(ENVIRONMENT, CUSTOMER_LIST, null, 10))) {
        console.log(response)

        if(DEBUG === true || (typeof DEBUG === "number" && ++curr_page >= DEBUG)) {
            console.info(`Script aborted after ${curr_page} pages because the debug option is active!`)
            break
        }
    }
}()