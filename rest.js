// Wrapper over `needle` for making asynchronious HTTP requests, with improved request setting and responses.

const {merge} = require("merge-anything")
const {stringify: stringifyQueryParameters} = require("query-string-for-all")
const {request} = require("needle")

module.exports = /*async*/ function(method, url, payload, query, headers, environment) {
    method = method.toUpperCase()

    headers = merge(
        {
            "Cache-Control": "no-cache",
            "Accept": "application/json" // prefer to receive JSON
        },
        headers || {}
    )

    const querystring = typeof query === "string"
        ? query
        : stringifyQueryParameters(query, {encode: false, sort: false})
    
    const href = querystring.length > 0
        ? url + "?" + querystring
        : url

    return new Promise(function(resolve, reject) {
        request(
            method, // request method
            href, // request url (including the querystring)
            payload, // body payload
            { // needle settings
                headers,
                open_timeout: 15000, // the default read_timeout and response_timeout is 0
                json: !headers["Content-Type"] || /json/i.test(headers["Content-Type"]), // {json: true} adds headers ["Content-Type", "Accept"] with value "application/json", then stringifies the body payload and automatically parses the response body
                parse_cookies: false
            },
            function(err, res) { // response callback (equal to Promise.then)
                if(err || res.statusCode < 200 && res.statusCode > 299) {
                    return reject(err)
                }

                let response = merge({}, res.body) // object copy

                Object.defineProperty(response, "_request_params", { // IMPORTANT: Cache original request parameters inside the response object as a hidden property! (eg. useful for continuous, paginated requests)
                    enumerable: false,
                    writable: false,
                    value: {
                        method,
                        url,
                        query,
                        href,
                        payload,
                        headers,
                        environment
                    }
                })

                return resolve(response)
            }
        )
    })
}
