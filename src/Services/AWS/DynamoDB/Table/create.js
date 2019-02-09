

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

			ClientsDynamoDB.client.createTable({
				TableName: properties.TableName,
				AttributeDefinitions: properties.AttributeDefinitions,
				KeySchema: properties.KeySchema,
				ProvisionedThroughput: properties.ProvisionedThroughput,
				GlobalSecondaryIndexes: properties.GlobalSecondaryIndexes,
			}, function(err) {
				if (err) console.log(err)
				cb(err)
			})
		},
		//
		//
		// // update status for resource to complete
		// function( cb ) {
		// 	cb()
		// },

	], function(err) {
		cb(err)
	})
}
