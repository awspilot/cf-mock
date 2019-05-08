var AWS = require('aws-sdk')


module.exports = function(DynamoDB, region, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )


	var iam  = new AWS.IAM({
		endpoint:        process.env.IAM_ENDPOINT,
		accessKeyId:     process.env.IAM_KEY,
		secretAccessKey: process.env.IAM_SECRET,
		region:          region,
	})

	async.waterfall([

		// delete the user
		function( cb ) {

			var payload = {
				UserName: properties.UserName
			};
			iam.deleteUser(payload, function(err, data) {
				if (err && err.code === 'NoSuchEntity')
					return cb()

				cb(err)
			});

		},
		// delete the user
		function( cb ) {
			var payload = {
				UserName: properties.UserName
			};
			iam.deleteUser(payload, function(err, data) {
				if (err && err.code === 'NoSuchEntity')
					return cb()


				cb(err)
			});

		},

		// delete the resource from db
		function( cb ) {

			DynamoDB
				.table('cloudformation_resources')
				.where('stack_id').eq(stack_id)
				.where('resource_name').eq(res_name)
				.delete( function(err) {

					cb(err)
				} )
		},
	], function(err) {
		// if err, mark resource as failed delete

		cb(err)
	})

}

