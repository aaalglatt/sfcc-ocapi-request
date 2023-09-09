# Salesforce OCAPI request client

## Installation

Run `npm i sfcc-ocapi-request` to install this NPM package.

## Configuration

I like to keep Salesforce connection credentials and miscellaneous API settings inside of a separate file, for example `./sfcc-ocapi-settings.js`

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

The above configuration example shows how I added three credentials: one API client (same on any environment), one Business Manager user for the *staging* environment and one Business Manager user for the *production* environment.

The *API client* is a requirement and it *must* have at least one alias, named `"apiclient"`. You may have one API client per Salesforce Commerce environment, then. You may have only one API Client for all of your environments of Salesforce Commerce, or  - it's up to you.

The *Business Manager user* is also a requirement and must be aliased with `"bmuser"`.

The aliases function argument can be a string or an array of strings. Aliases are used to access credentials within an environment by these custom names, for example `ACCESS_KEYS.production.shop_manager`. You can also have more than one alias referencing the exact same access key definition.


The variables `SITE_ID`, `CUSTOMER_LIST` and `DEBUG` which are used inside the `./example/` project files.
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
