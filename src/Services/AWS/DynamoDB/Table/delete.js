
module.exports = function(DynamoDB, ClientsDynamoDB, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	async.waterfall([
		// @todo: implement Retain Policy

		// delete the table
		function( cb ) {
			ClientsDynamoDB.client.deleteTable({ TableName: properties.TableName }, function(err) {
				cb(err)
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
