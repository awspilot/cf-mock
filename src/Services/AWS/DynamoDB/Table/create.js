

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
					// status in progress
				}, function(err) {
					cb(err)
				} )

		},

		// actually create the table
		function( cb ) {

			// temp hack because DynamoDB-local does not support BillingMode=PAY_PER_REQUEST

			if ( properties.BillingMode === 'PAY_PER_REQUEST' ) {
				properties.ProvisionedThroughput = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				if (Array.isArray(properties.GlobalSecondaryIndexes))
					properties.GlobalSecondaryIndexes = properties.GlobalSecondaryIndexes.map(function(gsi) {
						gsi.ProvisionedThroughput = { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
						return gsi;
					})
			}


			ClientsDynamoDB.client.createTable({
				TableName: properties.TableName,
				AttributeDefinitions: properties.AttributeDefinitions,
				KeySchema: properties.KeySchema,
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

		// // update status for resource to complete
		// function( cb ) {
		// 	cb()
		// },

	], function(err) {
		cb(err)
	})
}
