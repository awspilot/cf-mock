
module.exports = function(stack_id, res_name, type, properties, cb ) {
	console.log( res_name )

	DynamoDB
		.table('cloudformation_resources')
		.insert_or_replace({
			stack_id: stack_id,
			resource_name: res_name,
			type: type + ' ( Decoy )',
			properties: properties
		}, cb )
}
