# Salesforce OCAPI Request Client

> I'm already fixing bugs and working on the README...

For deeper understanding [inspect the source code at GitHub](https://github.com/geekhunger/sfcc-ocapi-request) and [look through the examples](https://github.com/geekhunger/sfcc-ocapi-request/tree/main/example).

## Installation

Run `npm i sfcc-ocapi-request` to install this NPM package.

## Imports

```js
const {request, pageloop, credentials} = require("sfcc-ocapi-request")
const {fetch} = request
const {
	ACCESS_KEYS,
	addAccessKey,
	SUPPORTED_ENVIRONTMENTS,
	isSupportedEnvironment,
	getSupportedEnvironment,
	addSupportedEnvironment,
	removeSupportedEnvironment,
	ENVIRONMENT_DOMAINS,
	addEnvironmentDomain
} = credentials
```

The `request` object contains functions to make HTTP and SFCC OCAPI calls. - For example, `request.fetch()` is basically just a wrapper around [`needle`](https://www.npmjs.com/package/needle) and can be used for generic REST requests. On the other hand, you can use `request[ENVIRONMENT].data()` and `request[ENVIRONMENT].shop()` to call DATA or SHOP Commerce APIs. - (You need to replace the `ENVIRONMENT` placeholder by a string like `"staging"`.) - For example: `request.development.data()` or `request.production.shop()`.

The `pageloop()` utility returns a generator function which can be used with `for`-loops, for example:

```js
const query = request.staging.shop("GET", "/customer_lists/CustomerListName/customers/0123456789", "-") // 3rd argument is Business Manager Site ID or Organization scope, denoted by '-'

for await(const response of pageloop(query)) { // note, how `query` is a Promise but `pageloop()` will resolve it automatically
	console.log(response)
}
```

The `credentials` object contains some helpers for managing the Salesfoce Commerce environments with their appropriate access keys. - Typically, you will have multiple SFCC environments and a couple different access keys based on those available environments.


## Access Keys

This package supports the simple and the advanced authentication methods. - The simple one uses API client credentials only (like its ID and password) to authorize your request to Salesforce Commerce. The downside of this authorization method is that it is only permitted to make requests to the `shop` OCAPIs. - The advanced authentication method on the other hand, uses a combination of Business Manager credentials, plus the API client. The advanced authorization can access both API realms (`data` and `shop`) at the same time but you will need to have both, a BM User + an API Client.

`credentials.ACCESS_KEYS` is a structured object which holds access keys to your Salesforce Commerce Cloud and its APIs. Access Keys are things like a Business Manager Users or an API Client. Typically, you will have at least one API Client and at least one Business Manager User. - The Salesforce Account Manager will allow you to can create an API client and a Business Manager user.

I like to keep my Salesforce connection credentials and miscellaneous API settings inside of a separate file, for example `./sfcc-ocapi-settings.js`

```js
const {credentials} = require("sfcc-ocapi-request")
const {ACCESS_KEYS, addAccessKey} = credentials

module.exports = {
	SITE_ID: "kneippDE",
	CUSTOMER_LIST: "kneippDE",
	ENVIRONMENT: "staging", // for example one of ["development", "staging", "production"]
	DEBUG: false, // number of records or false
	ACCESS_KEYS
}

// Domains of your Salesforce Commerce instances
addEnvironmentDomain("dev.kneipp.de", "development")
addEnvironmentDomain("stg.kneipp.de", "staging")
addEnvironmentDomain("kneipp.de", "production")

credentials.addAccessKey( // API Client (same on for all environments)
	"XXXXXXXXXXXXXXX", // username
	"XXXXXXXXXXXXXXX", // password
	"apiclient", // aliases or tags to use as shortcut referecne when fetching this access key from `ACCESS_KEYS[environment][alias]`
	null, // make credentials available for all supported environments
	"Kneipp Microservices Client", // request agent name
	"https://microservices.kneipp.de" // request agent origin url
)

credentials.addAccessKey( // Business Manager User ("staging" environment)
	"microservices@kneipp.de", // username
	"XXXXXXXXXXXXXXX", // password
	"bmuser", // alias (or multiple: ["bmuser", "api_client", ...])
	"staging" // environment (or multiple: ["development", "staging", ...])
)

addAccessKey( // Business Manager User ("production" environment)
	"microservices.kneipp.de",
	"XXXXXXXXXXXXXXX",
	"bmuser",
	"production"
)
```

The above configuration example shows how I added three credentials: an API client (same on any environment), one Business Manager user for the *staging* environment and another Business Manager user for the *production* environment. - Here's a short description of function arguments:

```js
credentials.addAccessKey(
	"microservices@kneipp.de", // username (string, commonly an email address)
	"XXXXXXXXXXXXXXX", // password (string, hash of characters, digits and special characters)
	"bmuser", // alias (or multiple: ["bmuser", "api_client", "product_manager_user"])
	"staging" // environment (or multiple: ["development", "staging", "production"])
)
```

The *Business Manager user* is also a requirement and must be aliased with `"bmuser"`.

The *API client* is a requirement and it *must* have at least one alias, named `"apiclient"`. You may have one API client per Salesforce Commerce environment, or you may also have a single API Client for all of your Salesforce Commerce environments. It's up to you.

(I personally do not use aliases for any specific tasks, but they were initially planned to be used to reference credentials by a custom name, like `ACCESS_KEYS.staging.product_manager_bmuser`. This way I could perform certain OCAPI tasks with one user and others with another user. But this functionality has never been thought through or used. Only `"apiclient"` and `"bmuser"` are used inside of `client-grant.js` and `user-grant.js` for request authorization, which is the reason that you need at least one API client and at least one Business Manager user with the mentioned aliases.)

The aliases argument can be a string or an array of strings. Aliases are used to access credentials within an environment by these custom names, for example `ACCESS_KEYS.production.shop_manager`. You can also have more than one alias referencing the exact same access key definition.

The configuration also shows how I added three domains for my Salesforce Commerce environments (development, staging and production).

```js
addEnvironmentDomain("dev.kneipp.de", "development")
addEnvironmentDomain("stg.kneipp.de", "staging")
addEnvironmentDomain("kneipp.net", "production")
```

These URLs are required for OCAPI requests. The reason is that the `request[environment][shop|data](...arguments)` functions are basically just convenience wrappers around `request.fetch()`. - `request.fetch` can work with URLs just fine, but `request.[environment][shop|data]` has different function arguments, specifically designed to comfortably work with SFCC OCAPI, and its arguments like `environment`, `site_id`, `api_realm`, `api_version`, and `path` are then concanated into a fully qualitying OCAPI base-url like `https://DOMAIN/s/SITE_ID/dw/API_REALM/API_VERSION/PATH`. - ([See this code](https://github.com/geekhunger/sfcc-ocapi-request/blob/main/api.js#L76) and [refer to this helper](https://github.com/geekhunger/sfcc-ocapi-request/blob/main/helper.js#L11) for further implementation details.)

```js
addEnvironmentDomain("dev.kneipp.de", "development") // If I would add this domain for "staging" environment
const response = await request[environment].shop("POST", "/order_search", "kneippDE", ...) // and run this OCAPI query
// then the request url would actually look somehing like this: https://dev.kneipp.de/s/kneippDE/dw/shop/v23_1/order_search
// See how we requested the path "/order_search" but received the entire base-url automatically? :)
// Btw, you can inspect `ENVIRONMENT_DOMAINS` to see all domains that you have registered through `addEnvironmentDomain(env, url)`.
```

The variables `SITE_ID`, `CUSTOMER_LIST` and `DEBUG` are just custom properties that I've added to use inside of the `./example/` project files.

The `ENVIRONMENT` variable is used to structure the Salesforce credentials.

After the credentials setup, described above, the `ACCESS_KEY` namespace could look something like this:

```txt
{
	"sandbox": {
		"apiclient": {"username": String, "password": String, "agent": String, "origin": String}
	},
	"development": {
		"apiclient": {"username": String, "password": String, "agent": String, "origin": String}
	},
	"staging": {
		"apiclient": {"username": String, "password": String, "agent": String, "origin": String},
		"bmuser": {"username": String, "password": String, "agent": undefined, "origin": undefined}
	},
	"production": {
		"apiclient": {"username": String, "password": String, "agent": String, "origin": String},
		"bmuser": {"username": String, "password": String, "agent": undefined, "origin": undefined}
	}
}
```

## Environments

`credentials.SUPPORTED_ENVIRONMENTS` is a list of Salesforce Commerce environments that your company has. Typically, you will have `"development"`, `"staging"`, `"production"` and maybe a couple of sandboxes, like `"sandbox-008"`. If `SUPPORTED_ENVIRONMENTS` is missing a (supported) identifier, you can use the fallowing call to register this new environment, e.g. `credentials.addSupportedEnvironment("sandbox-008")`.

## HTTP REST Requests

The request object contains a generic method for making HTTP calls: `request.fetch(method, url, payload, query, headers, environment, attempts = 3)`

This is basically a wrapper around `needle`. It always returns a Promise that is resolved on HTTP statuses between 200 and 299 - it rejects others. The call compiles and parses JSON requests and responses automatically (with proper headers and payload), unless you add custom `Content-Type` or/and `Accept` headers. [(You can find the source here.)](https://github.com/geekhunger/sfcc-ocapi-request/blob/main/rest.js#L34)

```js
let response = await request( // http request example taken from `./client-grant.js`
	"POST", // request method
	"https://account.demandware.com/dwsso/oauth2/access_token", // request url
	"grant_type=client_credentials", // request body payload (url-encoded)
	undefined, // request query parameters
	{ // request headers
		"Content-Type": "application/x-www-form-urlencoded",
		"x-dw-client-id": "TestClientID",
		"Authorization": "Basic " + new Buffer.from("User:Password").toString("Base64")
	},
	"production" // environment (used to fetch "apiclient" and "bmuser" credentials from ACCESS_KEYS for the correct SFCC environment)
)
```

## OCAPI Requests

The request object also contains shortcut functions tailored specifically to make HTTP calls to the Salesforce Open Commerce Application Programming Interface (OCAPI): `request[environment][data|shop](method, url, site_id, api_version, payload, query, headers, attempts = 3)`

Basically, there is a wrapper around the `request.fetch()` method for every environment defined in `credentials.SUPPORTED_ENVIRONMENTS` and for every OCAPI realm (data, shop). This is done for  convenience. For example, you can call `request.staging.data()` or `request.production.shop()`, in which case you no longer need to pass the environment to the function arguments anymore. You get additional arguments instead, like `site_id`, which are used to automatically compile the correct OCAPI url, like `https://yourdomain.net/s/yourSiteID/dw/shop/v21_6/orders/yourOrderNumber`.  [(You can find the implementation details here.)](https://github.com/geekhunger/sfcc-ocapi-request/blob/main/api.js#L70)

```js
return request[environment].data( // ocapi request example taken from `./example/inventory.js`
	"GET", // request method
	`/inventory_lists/kneippDE/product_inventory_records/918587`, // api endpoint path
	undefined, // site id (e.g. "kneippDE") or organization scope (denoted with "-" or undefined)
	undefined, // OCAPI version (default is "v23_1")
	undefined, // request body payload
	undefined, // request query parameters
	undefined // request headers
)
```

## Paginated OCAPI Requests

The reason I have build this iterator utility is that Salesfoce doesn't have consistent response objects across the `data` and `shop` realms. Some responses contain a `next` *string* with a query url, some responses contain a `next` *object* with indecies for subsequest requests and some responses do not contain a `next` property at all. - Thus, I've developed this utility, to lower the barier for working with paginated repsonses and to unify the syntax.

For example, you run a normal OCAPI query request like so:

```js
const response = await request.staging.data( // example taken from `./example/customers.js`
	"POST", // request method
	`/customer_lists/kneippDE/customer_search`, // ocapi request path/endpoint
	"-", // /customer_lists are accessible on the organization scope, not through a site id
	undefined, // ocapi version (will fallback onto "v23_1")
	{ // body payload
		query: {
			match_all_query: {}
		},
		select: "(**)",
		expand: [],
		count: 10,
		start: 0
	}
)
```

Once the Promise resolves, you can do with the response whatever you want. But most probably, the customer list will contain more than 10 entries and the response will look something like this:

```js
{
	_v: '23.1',
	_type: 'customer_search_result',
	count: 10,
	hits: [
		{ _type: 'customer_search_hit', data: [Object], relevance: 1 },
		{ _type: 'customer_search_hit', data: [Object], relevance: 1 },
		{ _type: 'customer_search_hit', data: [Object], relevance: 1 },
		...
	],
	next: {
		_type: 'result_page',
		count: 10,
		start: 10
	},
	query: {
		match_all_query: {
			_type: 'match_all_query'
		}
	},
	select: '(**)',
	start: 0,
	total: 288674
}
```

Do you see the total count of `288674` customer entrie within the first response? This means there are 28.000 more pages to fetch (with 10 entries per page). - At this point you could use the `response.next` property to build another `request.staging.data()` request and fetch page 2, then page 3 and so on.

But, you can also make things much easier by using the `pageloop()` utility like so:

```js
const query = request.staging.data("POST", "/customer_lists/kneippDE/customer_search", "-", undefined, {
	query: {match_all_query: {}},
	select: "(**)",
	expand: [],
	count: 10,
	start: 0
})

for await(const response of pageloop(query)) {
	for(const customer of response.hits) {
		console.log(customer)
	}
}
```

# ISC License

Copyright 2023 hallo@geekhunger.de

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
