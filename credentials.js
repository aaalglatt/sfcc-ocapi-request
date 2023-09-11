let credentials = module.exports = {
    ACCESS_KEYS: {},
    SUPPORTED_ENVIRONTMENTS: [
        "sandbox",
        "development",
        "staging",
        "production"
    ]
}

credentials.addSupportedEnvironment = function(identifier) {
    if(!credentials.isSupportedEnvironment(identifier)) {
        credentials.SUPPORTED_ENVIRONTMENTS.push(identifier)
    }
}

credentials.getSupportedEnvironment = function(identifier) {
    if(typeof identifier !== "string" && identifier.length < 1) {
        throw new TypeError(`Malformed environment identifier ${JSON.stringify(identifier)}!`)
    }
    const environments = credentials.SUPPORTED_ENVIRONTMENTS.filter(function(environment) {
        return environment.match(new RegExp("^" + identifier, "i"))
    })
    switch(environments.length) {
        case 0: return undefined
        case 1: return environments[0]
        default: throw new TypeError(`Environment identifier ${JSON.stringify(identifier)} is not unique and matches multiple supported environments ${JSON.stringify(environments)}!`)
    }
}

credentials.isSupportedEnvironment = function(identifier) {
    return !!credentials.getSupportedEnvironment(identifier)
}

credentials.removeSupportedEnvironment = function(identifier) {
    const environment = credentials.getSupportedEnvironment(identifier)
    if(!!environment) {
        const index = credentials.SUPPORTED_ENVIRONTMENTS.indexOf(environment)
        if(index > -1) {
            credentials.SUPPORTED_ENVIRONTMENTS.splice(index, 1)
        }
    }
}

credentials.addAccessKey = credentials.add = function(username, password, aliases, environments, agent, origin) {
    if(typeof username !== "string" || username.length < 1 || typeof password !== "string" || password.length < 1) {
        throw new TypeError(`Access key ${JSON.stringify({username, password})} is malformed! Expecting strings.`)
    }
    if(!Array.isArray(aliases)) {
        aliases = [aliases] // normalize argument type
    }
    if(!aliases.every(alias => typeof alias === "string")) {
        throw new TypeError(`Access key refers to a malformed list of aliases ${JSON.stringify(aliases)}! Expecting an array of one or more strings.`)
    }
    if((typeof agent !== "string" || agent.length < 1) && aliases.includes("apiclient")) {
        throw new TypeError(`Access key refers to a malformed agent name ${JSON.stringify(origin)}! The value is used for the 'User-Agent' HTTP request header and expected to be a string.`)
    }
    if((typeof origin !== "string" || !/^https?:\/\//.test(origin)) && aliases.includes("apiclient")) {
        throw new TypeError(`Access key refers to a malformed agent origin ${JSON.stringify(origin)}! The value is used for the 'Origin' HTTP request header and expected to be valid url.`)
    }
    if(environments !== undefined && environments !== null && !Array.isArray(environments)) {
        environments = [environments] // normalize argument type
    }
    if(Array.isArray(environments) && (environments.length < 1 || !environments.every(env => typeof env === "string"))) {
        throw new TypeError(`Access key points to a malformed list of environments ${JSON.stringify(environments)}! Expecting an array of one or more strings.`)
    }
    if(!environments) {
        for(const supported_environment of credentials.SUPPORTED_ENVIRONTMENTS) {
            credentials.addAccessKey(username, password, aliases, supported_environment, agent, origin) // force to add the same credentials to all supported environments
        }
    } else {
        for(const environment of environments) {
            if(!credentials.isSupportedEnvironment(environment)) {
                throw new TypeError(`Access key points to an unsupported environment ${JSON.stringify(environment)}! Currently supported environments are ${JSON.stringify(this.SUPPORTED_ENVIRONTMENTS)}. Use the 'addSupportedEnvironment(environment)' method to add supported environments. Environments are used to group access keys and 'SUPPORTED_ENVIRONTMENTS' is expected to be an array of strings.`)
            }
            const supported_environment = credentials.getSupportedEnvironment(environment) // normalize argument wording and writing style
            if(!credentials.ACCESS_KEYS[supported_environment]) {
                credentials.ACCESS_KEYS[supported_environment] = {}
            }
            for(const alias of aliases) {
                credentials.ACCESS_KEYS[supported_environment][alias] = {username, password, agent, origin}
            }
        }
    }
}
