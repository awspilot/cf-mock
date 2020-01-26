
var AWS = require('aws-sdk')

module.exports = function(DynamoDB, region, stack_id, res_name, type, properties, cb ) {

	var ClientsDynamoDB = new DynamodbFactory(
		new AWS.DynamoDB({
			endpoint:        process.env.DYNAMODB_ENDPOINT,
			accessKeyId:     process.env.DYNAMODB_KEY,
			secretAccessKey: process.env.DYNAMODB_SECRET,
			region:          region,
		})
	);

	async.waterfall([


		// create resource
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
					phisical_id: properties.TableName,
					status: 'CREATE_IN_PROGRESS',
				}, function(err) {
					cb(err)
				} )

		},

		// actually create the table
		function( cb ) {

			// apparently we still need this hack as aws-sdk expects ProvisionedThroughput for BillingMode=PAY_PER_REQUEST
			if ( properties.BillingMode === 'PAY_PER_REQUEST' ) {
				properties.ProvisionedThroughput = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				if (Array.isArray(properties.GlobalSecondaryIndexes))
					properties.GlobalSecondaryIndexes = properties.GlobalSecondaryIndexes.map(function(gsi) {
						gsi.ProvisionedThroughput = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
						return gsi;
					})
			}

			if (properties.hasOwnProperty('StreamSpecification') && (typeof properties.StreamSpecification === "object")) {

					if (properties.StreamSpecification.hasOwnProperty('StreamViewType')) {
						properties.StreamSpecification = {
							StreamEnabled: true,
							StreamViewType: properties.StreamSpecification.StreamViewType,
						}
					}

			}

			var payload = {
				TableName: properties.TableName,
				AttributeDefinitions: properties.AttributeDefinitions,
				KeySchema: properties.KeySchema,
				BillingMode: properties.BillingMode,
				ProvisionedThroughput: properties.ProvisionedThroughput,
				GlobalSecondaryIndexes: properties.GlobalSecondaryIndexes,
				LocalSecondaryIndexes: properties.LocalSecondaryIndexes,
			}

			if (properties.hasOwnProperty('StreamSpecification'))
				payload.StreamSpecification = properties.StreamSpecification


			ClientsDynamoDB.client.createTable(payload, function(err) {

				if (err)
					return cb({
						errorCode: err.code,
						errorMessage: err.message,
						RawApiPayload: JSON.stringify(payload),
						RawApiError: JSON.stringify(err),
					})


				cb(err)
			})
		},

		// set TTL, if needed
		function( cb ) {
			if (! properties.hasOwnProperty('TimeToLiveSpecification') )
				return cb()

			var params = {
				TableName: properties.TableName,
				TimeToLiveSpecification: properties.TimeToLiveSpecification
			};
			ClientsDynamoDB.client.updateTimeToLive(params, function(err, data) {
				cb()
			});
		},

		// update status for resource to complete
		function( cb ) {
		DynamoDB
			.table('cloudformation_resources')
			.where('stack_id').eq(stack_id)
			.where('resource_name').eq(res_name)
			.update({
				status: 'CREATE_COMPLETE',
			}, function(err) {
				cb(err)
			} )
		},

	], function(err) {
		cb(err)
	})
}
