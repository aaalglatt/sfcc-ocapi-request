const {request, pageloop} = require("../public")
//const {DEBUG, ACCESS_KEYS, ENVIRONMENT, SITE_ID} = require("./settings")
const {DEBUG, ACCESS_KEYS, ENVIRONMENT, SITE_ID} = require("./private-settings") // NOTE: Use the line above, I just have my own private ones which are obviously gitignore'd

const getOrders = async function( // @environment and @site_id are mandatory, every other argument is optional
    environment,
    site_id,
    order_id,
    customer_id,
    from_date,
    to_date,
    attr_selection = "(**)",
    export_status = ["not_exported", "exported", "ready", "failed"],
    sorting_field = "creation_date",
    sorting_order = "desc",
    page_results = 100,
    page_start = 0
) {
    return await request[environment].shop(
        "POST", // request method
        `/order_search`, // api endpoint url
        site_id, // organization or site id
        undefined, // fallback to default OCAPI version
        { // body payload
            select: attr_selection,
            query: {
                bool_query: {
                    must: [
                        typeof order_id !== "string" ? undefined : {
                            text_query: {
                                fields: ["order_no"],
                                search_phrase: order_id
                            }
                        },
                        typeof customer_id !== "string" ? undefined : {
                            text_query: {
                                fields: ["customer_no"],
                                search_phrase: customer_id
                            }
                        },
                        {
                            filtered_query: {
                                query: {
                                    term_query: { // IMPORTANT: search only of successful orders
                                        fields: ["export_status"],
                                        operator: "one_of",
                                        values: export_status
                                    }
                                },
                                filter: {
                                    range_filter: {
                                        field: "creation_date",
                                        from: from_date,
                                        to: to_date || new Date(),
                                        from_inclusive: true,
                                        to_inclusive: true
                                    }
                                }
                            }
                        }
                    ].filter(Boolean)
                }
            },
            sorts: [
                {
                    field: sorting_field,
                    sort_order: sorting_order
                }
            ],
            count: parseInt(page_results),
            start: parseInt(page_start)
        }
    )
}

!async function() {
    //console.log(ACCESS_KEYS)

    let curr_page = 0

    const query = getOrders(
        ENVIRONMENT,
        SITE_ID,
        undefined,
        undefined,
        new Date(2023, 8, 3),
        new Date(2023, 8, 5),
        undefined,
        undefined,
        undefined,
        undefined,
        10,
        203
    )

    for await(const response of pageloop(query)) {
        console.log(response)

        if(DEBUG === true || (typeof DEBUG === "number" && ++curr_page >= DEBUG)) {
            console.info(`Script aborted after ${curr_page} pages because the debug option is active!`)
            break
        }
    }
}()
