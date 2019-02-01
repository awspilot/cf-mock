module.exports = {
	CreateStack: function(_POST, cb ) {
		var account_id = '000000000000'
		var stack_id   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) { var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); });

		DynamoDB
			.table('cloudformation_stacks')
			.insert_or_replace({
				account_id: account_id,
				stack_id: stack_id,
				name: _POST.StackName,
				created_at: new Date().getTime(),
			}, function(err,data) {
				if (err)
					return cb(err)

				cb(null, { StackId: stack_id})
			})

		//console.log("create stack", console.log('CreateStack', _POST))

	}
}
