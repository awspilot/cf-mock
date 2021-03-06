
var AWS = require('aws-sdk')

module.exports = function(DynamoDB, region, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	var ClientsDynamoDB = new DynamodbFactory(
		new AWS.DynamoDB({
			endpoint:        process.env.DYNAMODB_ENDPOINT,
			accessKeyId:     process.env.DYNAMODB_KEY,
			secretAccessKey: process.env.DYNAMODB_SECRET,
			region:          region,
		})
	);

	async.waterfall([
		// @todo: implement Retain Policy

		// delete the table
		function( cb ) {
			var payload = { TableName: properties.TableName }
			ClientsDynamoDB.client.deleteTable(payload, function(err) {
				
				if (err && err.code === 'ResourceNotFoundException')
					return cb()

				if (err)
					return cb({
						errorCode: err.code,
						errorMessage: err.message,
						RawApiPayload: JSON.stringify(payload),
						RawApiError: JSON.stringify(err),
					})
				cb()
			} )
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
