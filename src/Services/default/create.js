
module.exports = function(DynamoDB, ClientsDynamoDB ,stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	DynamoDB
		.table('cloudformation_resources')
		.insert_or_replace({
			stack_id: stack_id,
			resource_name: res_name,
			type: type,
			properties: properties,
			created_at: new Date().getTime(),
			updated_at: new Date().getTime(),
			phisical_id: 'decoy',
			status: 'CREATE_COMPLETE',
		}, cb )
}
