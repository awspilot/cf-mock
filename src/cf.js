//const YAML = require('yaml')
var yaml = require('js-yaml')


module.exports = {
	CreateStack: function(_POST, cb ) {
		var account_id = '000000000000'
		var stack_id   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) { var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); });
		var template;

		form_parameters.extract_param('Parameters', _POST )
		form_parameters.extract_param('NotificationARNs', _POST )

		//console.log( "CreateStack", JSON.stringify(_POST))

		if (!_POST.hasOwnProperty('Parameters'))
			_POST.Parameters = []

		async.waterfall([

			// create stack in db
			function( cb ) {
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

						cb()
					})
			},

			function( cb ) {
				template = yaml.safeLoad( _POST.TemplateBody )

				//yml = YAML.parse( _POST.TemplateBody )


				cb()
			},


			function( cb ) {
				if ( !template.hasOwnProperty('Parameters'))
					return cb()

				if (typeof template.Parameters !== 'object' )
					return cb()

				async.each(Object.keys(template.Parameters), function( p, cb) {
					// @todo: add default value

					var value = null
					if ( template.Parameters[p].hasOwnProperty('Default') )
						value = template.Parameters[p].Default;

					// override parameter values with supplied values
					_POST.Parameters.map(function(pp) {
						if ( pp.ParameterKey === p )
							value = pp.ParameterValue

						return pp;
					})



					DynamoDB
						.table('cloudformation_stack_parameters')
						.insert_or_replace({
							stack_id: stack_id,
							key: p,
							value: value,
						}, function( err ) {
							cb(err)
						})
				}, function( err ) {
					cb()
				} )
			},





			//console.log("create stack", console.log('CreateStack', _POST))
			//console.log(JSON.stringify(yml,null,"\t"))
		], function( err ) {
			if (err)
				return cb(err)


			cb(null, { StackId: stack_id})

		})






	}
}
