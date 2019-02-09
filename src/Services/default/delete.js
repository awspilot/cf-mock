
module.exports = function(DynamoDB, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	DynamoDB
		.table('cloudformation_resources')
		.where('stack_id').eq(stack_id)
		.where('resource_name').eq(res_name)
		.delete( cb )
}
