const request = require("./api")
const {merge} = require("merge-anything")

const isPromise = function(value) {
    return (
        !Array.isArray(value)
        && (
            typeof value === "object"
            || typeof value === "function"
        )
        && typeof value.then === "function"
    )
}

const isArray = function(value) {
    return Array.isArray(value)
}

const isObject = function(value) {
    return typeof value === "object" && value !== null
}

const isString = function(value) {
    return typeof value === "string"
}

const isResponse = function(response) {
    return (
        isObject(response)
        && (
            response.count > 0
            || response.hits?.length > 0
            || response.data?.length > 0
        )
    )
}

const getPagination = function(response) {
    const curr_count = (
        response.count
        || response.hits?.length
        || response.data?.length
        || 0 // default
    )
    const nxt_count = Math.min(
        response.next?.count
        || response._request_params?.payload?.count
        || response._request_params?.query?.count
        || response.count
        || response.hits?.length
        || response.data?.length
        || 1, // default
        response.total - (response.next?.start || response.start) // clamp
    )
    const nxt_start = Math.min(
        response.next?.start
        || response.start + nxt_count,
        response.total - nxt_count // clamp
    )
    return {
        curr_count,
        nxt_count,
        nxt_start
    }
}

const isPaginated = function(response) {
    const {nxt_start, nxt_count} = getPagination(response)
    return (
        isResponse(response)
        && (
            isString(response.next)
            || (
                isObject(response.next)
                && nxt_count > 0
                && nxt_start + nxt_count <= response.total
            )
        )
    )
}

const sleep = function(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000)
    })
}

module.exports = async function*(search_response) { // Generator function to be used with a await-for-loop, e.g.: for await(const promotions of getActivePromotions(site_id)) {...}
    if(isPromise(search_response)) {
        console.log(`Began fetching records from paginated search query...`)
        search_response = await search_response
    }

    let curr_page = 1 // count of already made page requests
    let num_pages = 1
    const page_batch = 30 // threshold of pages to trigger a cooling down event after every N-th page

    if(isResponse(search_response)) {
        const {curr_count} = getPagination(search_response)
        if(isPaginated(search_response)) {
            curr_page = Math.max(1, Math.ceil(search_response.start / curr_count)) // update current page number
            num_pages = Math.max(curr_page, Math.ceil(search_response.total / curr_count)) // calculate overall page count
            if(isString(search_response.next)) {
                console.log(`Fetched ${curr_count} records from paginated search query '${search_response._request_params?.href}'.`)
            } else {
                console.log(`Fetched ${curr_count} records from page ${curr_page} of ${num_pages}.`)
            }
        } else {
            console.log(`Fetched ${curr_count} records from search query '${search_response._request_params?.href}'.`)
        }
        yield search_response // first request query ran already, so await and return it's results before continuing a series of requests from page 2
    }

    while(isPaginated(search_response) && curr_page < num_pages) {
        if(curr_page % page_batch === 0) {
            const countdown = 60
            console.log(`Pause paginated requests for ${countdown} seconds and let OCAPI cool down...`)
            await sleep(countdown)
            console.log(`Continue paginated requests...`)
        }

        if(isString(search_response.next)) {
            const {curr_count} = getPagination(search_response)
            console.log(`Fetching ${curr_count || "more"} records from paginated search query '${search_response.next}'...`)
            search_response = await request.fetch(
                "GET",
                search_response.next,
                search_response._request_params?.payload,
                undefined, // `search_response.next` already contains the query string!
                search_response._request_params?.headers,
                search_response._request_params?.environment
            )
        } else {
            const {nxt_count, nxt_start} = getPagination(search_response)
            console.log(`Fetching ${nxt_count} records from page ${curr_page + 1} of ${num_pages}, continuing at query index ${nxt_start}...`)
            search_response = await request.fetch(
                search_response._request_params?.method,
                search_response._request_params?.url,
                merge(
                    search_response._request_params?.payload,
                    {start: nxt_start}
                ),
                search_response._request_params?.query,
                search_response._request_params?.headers,
                search_response._request_params?.environment
            )
        }

        const {curr_count} = getPagination(search_response)
        console.log(`Fetched ${curr_count} records from page ${++curr_page} of ${num_pages}.`)

        //console.log(search_response)
        yield search_response
    }

    console.log(`Finished fetching records from paginated search query.`)
}
