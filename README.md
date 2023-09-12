# Salesforce OCAPI request client

> I'm already working on the README...

## Installation

Run `npm i sfcc-ocapi-request` to install this NPM package.

## Imports

```js
const {request, pageloop, credentials} = require("sfcc-ocapi-request")
const {fetch} = request
const {ACCESS_KEYS, addAccessKey, SUPPORTED_ENVIRONTMENTS, isSupportedEnvironment, getSupportedEnvironment, addSupportedEnvironment, removeSupportedEnvironment} = credentials
```

The `request` object contains functions to make HTTP and SFCC OCAPI calls. - For example, `request.fetch()` is basically just a wrapper around [`needle`](https://www.npmjs.com/package/needle) and can be used for generic REST fetches. On the other hand, you can use `request[ENVIRONMENT].data()` and `request[ENVIRONMENT].shop()` to call DATA or SHOP Commerce APIs. - (You need to replace the `ENVIRONMENT` placeholder by a string like `"staging"`.) - For example: `request.development.data()` or `request.production.shop()`.

The `pageloop()` utility returns a generator function which can be used with `for`-loops, for example:

```js
const query = request.staging.shop("GET", "/customer_lists/CustomerListName/customers/0123456789", "-") // 3rd argument is Business Manager Site ID or Organization scope, denoted by '-'

for await(const response of pageloop(query)) { // note, how `query` is a Promise but `pageloop()` will resolve it automatically
	console.log(response)
}
```

Typically, you will have multiple SFCC environments and a couple different access keys based on those available environments. - The `credentials` object contains some helpers for managing the Salesfoce Commerce environments with their appropriate access keys.


## Access Keys

This package supports a simple and an advanced authentication method. The simple one uses API client credentials only (like its ID and password). The downside of this authorization method, is that it is permitted to make requests to the `shop` OCAPIs only. The advanced authentication method on the other hand, uses a combination of Business Manager credentials, plus the API client. The advanced authorization can access both API realms (`data` and `shop`) at the same time but you will need to have both, a BM User + an API Client.

`credentials.ACCESS_KEYS` is a structured object which holds access keys to your Salesforce Commerce Cloud and its APIs. Access Keys are things like a Business Manager Users or an API Client. Typically, you will have at least one API Client and at least one Business Manager User. - The Salesforce Account Manager will allow you to can create an API client and a Business Manager user.

I like to keep my Salesforce connection credentials and miscellaneous API settings inside of a separate file, for example `./sfcc-ocapi-settings.js`

```js
const {credentials} = require("sfcc-ocapi-request")
const {ACCESS_KEYS, addAccessKey} = credentials

module.exports = {
	SITE_ID: "businessManagerSiteName",
	CUSTOMER_LIST: "businessManagerCustomerListName",
	ENVIRONMENT: "environmentName", // for example one of ["development", "staging", "production"]
	DEBUG: false, // number of records or false
	ACCESS_KEYS
}

credentials.addAccessKey( // API Client (same on for all environments)
	"abcdefghijklmnopqrstuvwxyz0987654321", // username
	"ClieNtPa$Sword", // password
	"apiclient", // aliases or tags to use as shortcut referecne when fetching this access key from `ACCESS_KEYS[environment][alias]`
	null, // make credentials available for all supported environments
	"OCAPI Test Client", // request agent name
	"https://whitelisted.domain-origin.net" // request agent origin url
)

credentials.addAccessKey( // Business Manager User ("staging" environment)
	"user.name@company.at", // username
	"Pa$Sword", // password
	"bmuser", // alias (or multiple: ["bmuser", "api_client", ...])
	"staging" // environment (or multiple: ["development", "staging", ...])
)

addAccessKey( // Business Manager User PRODUCTION
	"user.name@company.at",
	"an0THErP@$Sword",
	"bmuser",
	"production"
)
```

The above configuration example shows how I added three credentials: an API client (same on any environment), one Business Manager user for the *staging* environment and another Business Manager user for the *production* environment. - Here's a short description of function arguments:

```js
credentials.addAccessKey(
	"user.name@company.at", // username (string, commonly an email address)
	"Pa$Sword", // password (string, hash of characters, digits and special characters)
	"bmuser", // alias (or multiple: ["bmuser", "api_client", "product_manager_user"])
	"staging" // environment (or multiple: ["development", "staging", "production"])
)
```

The *Business Manager user* is also a requirement and must be aliased with `"bmuser"`.

The *API client* is a requirement and it *must* have at least one alias, named `"apiclient"`. You may have one API client per Salesforce Commerce environment, or you may also have a single API Client for all of your Salesforce Commerce environments. It's up to you.

(I personally do not use aliases for any specific tasks, but they were initially planned to be used to reference credentials by a custom name, like `ACCESS_KEYS.staging.product_manager_bmuser`. This way I could perform certain OCAPI tasks with one user and others with another user. But this functionality has never been thought through or used. Only `"apiclient"` and `"bmuser"` are used inside of `client-grant.js` and `user-grant.js` for request authorization, which is the reason that you need at least one API client and at least one Business Manager user with the mentioned aliases.)

The aliases argument can be a string or an array of strings. Aliases are used to access credentials within an environment by these custom names, for example `ACCESS_KEYS.production.shop_manager`. You can also have more than one alias referencing the exact same access key definition.

The variables `SITE_ID`, `CUSTOMER_LIST` and `DEBUG` which are custom properties that are used inside of the `./example/` project files.

The `ENVIRONMENT` variable is used to structure the Salesforce credentials.

After the credentials setup, shown above, the `ACCESS_KEY` namespace could look something like this:

```json
{
	"sandbox": {
		"apiclient": {
			"username": "abcdefghijklmnopqrstuvwxyz0987654321",
			"password": "ClieNtPa$Sword",
			"agent": "OCAPI Test Client",
			"origin": "https://whitelisted.domain-origin.net"
		}
	},
	"development": {
		"apiclient": {
			"username": "abcdefghijklmnopqrstuvwxyz0987654321",
			"password": "ClieNtPa$Sword",
			"agent": "OCAPI Test Client",
			"origin": "https://whitelisted.domain-origin.net"
		}
	},
	"staging": {
		"apiclient": {
			"username": "abcdefghijklmnopqrstuvwxyz0987654321",
			"password": "ClieNtPa$Sword",
			"agent": "OCAPI Test Client",
			"origin": "https://whitelisted.domain-origin.net"
		},
		"bmuser": {
			"username": "user.name@company.at",
			"password": "Pa$Sword",
			"agent": undefined,
			"origin": undefined
		}
	},
	"production": {
		"apiclient": {
			"username": "abcdefghijklmnopqrstuvwxyz0987654321",
			"password": "ClieNtPa$Sword",
			"agent": "OCAPI Test Client",
			"origin": "https://whitelisted.domain-origin.net"
		},
		"bmuser": {
			"username": "user.name@company.at",
			"password": "an0THErP@$Sword",
			"agent": undefined,
			"origin": undefined
		}
	}
}
```

## Environments

`credentials.SUPPORTED_ENVIRONMENTS` is a list of Salesforce Commerce environments that your company has. Typically, you will have `"development"`, `"staging"`, `"production"` and maybe a couple of sandboxes, like `"sandbox-008"`. If `SUPPORTED_ENVIRONMENTS` is missing a (supported) identifier, you can use the fallowing call to register this new environment, e.g. `credentials.addSupportedEnvironment("sandbox-008")`.

## API request

description

# ISC License

Copyright 2023 hello@geekhunger.com

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
