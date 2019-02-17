

module.exports = function(DynamoDB, ClientsDynamoDB , stack_id, res_name, type, properties, cb ) {

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

			if (properties.hasOwnProperty('StreamSpecification')) {
				if (typeof properties.StreamSpecification === "object") {
					if (typeof properties.StreamSpecification.StreamEnabled === "string") {
						properties.StreamSpecification.StreamEnabled = properties.StreamSpecification.StreamEnabled.toLowerCase() === "true" ? true : false
					} else {
						if (properties.StreamSpecification.hasOwnProperty('StreamViewType'))
							properties.StreamSpecification.StreamEnabled = true
					}
				}
			}

			ClientsDynamoDB.client.createTable({
				TableName: properties.TableName,
				AttributeDefinitions: properties.AttributeDefinitions,
				KeySchema: properties.KeySchema,
				BillingMode: properties.BillingMode,
				ProvisionedThroughput: properties.ProvisionedThroughput,
				GlobalSecondaryIndexes: properties.GlobalSecondaryIndexes,
				LocalSecondaryIndexes: properties.LocalSecondaryIndexes,
				StreamSpecification: properties.StreamSpecification,
			}, function(err) {
				if (err) console.log(err)
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
