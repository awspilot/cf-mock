
var AWS = require('aws-sdk')

module.exports = function( DynamoDB, region, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )


	var iam  = new AWS.IAM({
		endpoint:        process.env.IAM_ENDPOINT,
		accessKeyId:     process.env.IAM_KEY,
		secretAccessKey: process.env.IAM_SECRET,
		region:          region,
	})

	async.waterfall([

		function( cb ) {
			DynamoDB
				.table('cloudformation_resources')
				.insert_or_replace({
					stack_id: stack_id,
					resource_name: res_name,
					type: type,
					properties: properties,
					created_at: new Date().getTime(),
					updated_at: new Date().getTime(),
					phisical_id: properties.UserName,
					status: 'CREATE_IN_PROGRESS',
				}, function(err) {
					cb(err)
				} )

		},

		// create the user
		function( cb ) {

			var payload = {
				UserName: properties.UserName,
			};
			iam.createUser(payload, function(err, data) {
				if (err)
					return cb({
						errorCode: err.code,
						errorMessage: err.message,
						RawApiPayload: JSON.stringify(payload),
						RawApiError: JSON.stringify(err),
					})

				cb()
			});

		},

		function( cb ) {
			DynamoDB
				.table('cloudformation_resources')
				.insert_or_replace({
					stack_id: stack_id,
					resource_name: res_name,
					type: type,
					properties: properties,
					created_at: new Date().getTime(),
					updated_at: new Date().getTime(),
					phisical_id: properties.UserName,
					status: 'CREATE_COMPLETE',
				}, function(err) {
					cb(err)
				} )
		},
	], function(err) {

		cb(err)
	})



}
