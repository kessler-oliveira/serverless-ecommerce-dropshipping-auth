'use strict'

const jwt = require('jsonwebtoken');

const buildIAMPolicy = (userId, effect, resource) => {
	console.log(JSON.stringify(`buildIAMPolicy ${userId} ${effect} ${resource}`))

	const policy = {
		principalId: userId,
		policyDocument: {
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'execute-api:Invoke',
					Effect: effect,
					Resource: resource,
				},
			],
		}
	}

	console.log(JSON.stringify(policy));
	return policy
}

const scope = {
	CLIENT: [
		"GET/users/self",
		"PUT/users/self",
		"DELETE/users/self",
	],
	EXTERNAL: [
		"GET/users/self",
		"PUT/users/self",
		"DELETE/users/self",
	],
	VENDOR: [
		"GET/users/self",
		"PUT/users/self",
		"DELETE/users/self",
		"POST/products/vendor",
		"GET/products/.{36}/vendor",
		"GET/products/vendor",
		"PUT/products/.{36}/vendor",
		"DELETE/products/.{36}/vendor",
	],
	ADMIN: [
		"GET/users/self",
		"GET/users/.{36}/admin",
		"GET/users/admin",
		"PUT/users/self",
		"PUT/users/.{36}/admin",
		"DELETE/users/self",
		"DELETE/users/.{36}/admin",
		"POST/vendors/.{36}/allow/admin",
		"DELETE/vendors/.{36}/deny/admin",
		"GET/vendors/.{36}/admin",
		"GET/vendors/admin",
		"POST/products/admin",
		"GET/products/.{36}/admin",
		"GET/products/admin",
		"PUT/products/.{36}/admin",
		"DELETE/products/.{36}/admin",
	]
}

const authorizeUser = async (role, methodArn) => {
	try {
		return scope[role].some(element => new RegExp(`${element}$`).test(methodArn));
	} catch (err) {
		console.log(JSON.stringify(err))
		return false
	}
};

module.exports.handler = async (event, context, callback) => {

	console.log(JSON.stringify(event))
	
	const token = event.authorizationToken;

	try {
		const decoded = jwt.verify(token.replace(/^Bearer\s/, ''), process.env.JWT_SECRET)
		console.log(JSON.stringify(decoded))

		const isAllowed = await authorizeUser(decoded.role, event.methodArn)

		const effect = isAllowed ? 'Allow' : 'Deny'

		callback(null, buildIAMPolicy(decoded.id, effect, event.methodArn))
	} catch (err) {
		console.log(JSON.stringify(err))
		callback('Unauthorized')
	}
}