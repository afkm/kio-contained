// Load modules

var Hoek = require('hoek');
var Request = require('request');
var KioCrypt = require('kio-crypt');


// Declare internals

var internals = {
	defaults: {
		host: "http://localhost",
		database: "containpub",
		user: "must be set",
		password: "must be set"
	}
};


exports.register = function (plugin, options, next) {

	var settings = Hoek.applyToDefaults(internals.defaults, options);

	// Base path for HTTP queries
	settings.httpBase = settings.host + '/' + settings.database + '/';

	// Basic HTTP Authentification for queries
	settings.httpAuth = {
		'user': settings.user,
		'pass': settings.pass
	};

	// Wrapper for getting contents by site ID, token and path
	var getPath = function (request, reply) {

		// Validate params
		if (!request.pre ||
			!request.pre.siteout ||
			!request.pre.siteout.site ||
			!request.pre.siteout.token) {
			// throw new Error('Site paramters are missing or incomplete.');
			return reply(400);	// TODO: proper error response with boom
		}

		// Query
		var query = [];
		// 1. Token
		query.push('token=' + request.pre.siteout.token);
		// 2. Site ID
		query.push('site=' + request.pre.siteout.site);
		// 3. Path
		query.push('path=' + request.path);
		
		// Generate RIPEMD160 hash for query
		var hash = KioCrypt.hash(query.join('|'));

		// Perform request
		Request.get(settings.httpBase + hash, {auth: settings.httpAuth}, function (error, response, body) {

			if (error) {
				// throw new Error('Request error');
				return reply(500);	// TODO: proper error response with boom
			}

			// TODO: Check for empty body and return 404

			reply(JSON.parse(body));
		});

	};

    plugin.expose({ path: getPath });

	next();
};
