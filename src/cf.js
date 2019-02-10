//const YAML = require('yaml')
var yaml = require('js-yaml')


module.exports = {
	CreateStack: function(_POST, DynamoDB, ClientsDynamoDB, region, cb ) {
		var account_id = '000000000000'
		var stack_id   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) { var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); });
		var template;

		form_parameters.extract_param('Parameters', _POST )
		form_parameters.extract_param('NotificationARNs', _POST )

		//console.log( "CreateStack", JSON.stringify(_POST,null,"\t"))

		if (!_POST.hasOwnProperty('Parameters'))
			_POST.Parameters = []

		async.waterfall([

			// check name
			function( cb ) {

				DynamoDB
					.table('cloudformation_stacks')
					.index('name-index')
					.where('account_id').eq(account_id)
					.where('name').eq(_POST.StackName)
					.query(function(err, stacks) {
						if (err)
							return cb({ code: '', message: 'Failed'})

						if (stacks.length)
							return cb({ code: '', message: 'Another stack with the same name exists'})

						cb()
					})
			},


			// create stack in db
			function( cb ) {
				DynamoDB
					.table('cloudformation_stacks')
					.insert_or_replace({
						account_id: account_id,
						stack_id: stack_id,
						name: _POST.StackName,
						created_at: new Date().getTime(),
						status: 'CREATE_IN_PROGRESS',
					}, function(err,data) {
						if (err)
							return cb(err)

						cb()
					})
			},

			function( cb ) {
				template = yaml.safeLoad( _POST.TemplateBody )

				//yml = YAML.parse( _POST.TemplateBody )

				//console.log( "YML", JSON.stringify(template,null,"\t"))

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
						.table('cloudformation_parameters')
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


			// loop resources
			function( cb ) {
				var resources = Object.keys(template.Resources)
				if (! Array.isArray(resources) )
					return cb({ code: '', message: 'Invalid Resource List' })

				async.each(resources, function(res_name, cb ) {

					if (typeof template.Resources[res_name] !== "object" )
						return cb({ code: '', message: 'Invalid Resource ' + res_name })

					if (!template.Resources[res_name].hasOwnProperty('Type'))
						return cb({ code: '', message: 'Missing Resource type for ' + res_name })

					if (!template.Resources[res_name].hasOwnProperty('Properties'))
						return cb({ code: '', message: 'Missing Resource properties for ' + res_name })

					try {
						var respath = './Services/' + template.Resources[res_name].Type.split('::').join('/') + '/create.js';
						require(respath)(DynamoDB, ClientsDynamoDB, stack_id,res_name, template.Resources[res_name].Type, template.Resources[res_name].Properties, cb )
					} catch (e) {
						require('./Services/default/create.js')(DynamoDB, ClientsDynamoDB, stack_id,res_name, template.Resources[res_name].Type, template.Resources[res_name].Properties, cb )
					}

				}, function(err) {
					if (err)
						console.log(err)
					cb(err)
				})
			},












			// update stack.status = CREATE_COMPLETE
			function(cb) {
				DynamoDB
					.table('cloudformation_stacks')
					.where('account_id').eq(account_id)
					.where('stack_id').eq(stack_id)
					.update({ status: 'CREATE_COMPLETE' },cb)
			},

			//console.log(JSON.stringify(yml,null,"\t"))
		], function( err ) {
			if (err)
				return cb(err)

			cb(null, `
				<CreateStackResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
				  <CreateStackResult>
				    <StackId>arn:aws:cloudformation:`+region+`:` + account_id + `:stack/` + _POST.StackName + `/` + stack_id + `</StackId>
				  </CreateStackResult>
				  <ResponseMetadata>
				    <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
				  </ResponseMetadata>
				</CreateStackResponse>
			`)
		})






	},
	DeleteStack: function(_POST, DynamoDB, ClientsDynamoDB, region, cb ) {
		var account_id = '000000000000'

		var stack;
		async.waterfall([

			// create stack in db
			function( cb ) {
				DynamoDB
					.table('cloudformation_stacks')
					.index('name-index')
					.where('account_id').eq(account_id)
					.where('name').eq(_POST.StackName)
					.query(function(err,dbstacks) {
						if (err)
							return cb(err)

						if (!dbstacks.length)
							return cb({err: 'STACK_NOT_FOUND'})

						stack=dbstacks[0];
						cb()
					})
			},

			// delete params
			function(cb) {
				DynamoDB
					.table('cloudformation_parameters')
					.where('stack_id').eq(stack.stack_id)
					.query(function(err,dbparams) {
						if (err)
							return cb(err)

						async.each(dbparams, function(param,cb) {
							DynamoDB
								.table('cloudformation_parameters')
								.where('stack_id').eq(param.stack_id)
								.where('key').eq( param.key )
								.delete(cb)
						}, function(err) {
							cb(err)
						})
					})
			},

			// loop resources
			function( cb ) {
				DynamoDB
					.table('cloudformation_resources')
					.where('stack_id').eq(stack.stack_id)
					.query(function(err, dbresources ) {
						if (err)
							return cb(err)

						async.each(dbresources, function(res, cb ) {

							try {
								var respath = './Services/' + res.type.split('::').join('/') + '/delete.js';
						 		require(respath)(DynamoDB, ClientsDynamoDB, res.stack_id,res.resource_name, res.type, res.properties, cb  )
							} catch (e) {
								require('./Services/default/delete.js')(DynamoDB, ClientsDynamoDB, res.stack_id,res.resource_name, res.type, res.properties, cb )
							}

						}, function(err) {
							if (err)
								return cb(err)

							cb()
						})

					})

			},


			// delete stack
			function( cb ) {
				DynamoDB
					.table('cloudformation_stacks')
					.where('account_id').eq(account_id)
					.where('stack_id').eq(stack.stack_id)
					.delete(function(err) {
						cb(err)
					})
			}
		], function(err) {
			if (err)
				return cb(err)

			cb(null, `
				<DeleteStackResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
				  <ResponseMetadata>
				    <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
				  </ResponseMetadata>
				</DeleteStackResponse>
			`)
		})


		//console.log('DeleteStack', _POST)
	},
	ListStacks: function(_POST, DynamoDB, ClientsDynamoDB, region, cb ) {
		var account_id = '000000000000'

		// CREATE_IN_PROGRESS | CREATE_FAILED | CREATE_COMPLETE | ROLLBACK_IN_PROGRESS | ROLLBACK_FAILED | ROLLBACK_COMPLETE | DELETE_IN_PROGRESS | DELETE_FAILED | DELETE_COMPLETE | UPDATE_IN_PROGRESS | UPDATE_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_COMPLETE | UPDATE_ROLLBACK_IN_PROGRESS | UPDATE_ROLLBACK_FAILED | UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_ROLLBACK_COMPLETE | REVIEW_IN_PROGRESS

		// todo:  <CreationTime>2018-10-27T11:35:09.909Z</CreationTime>
		ractive = new Ractive({
			template: `
			  <ListStacksResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
				<ListStacksResult>
				  <StackSummaries>
					{{#stacks}}
					<member>
					  <CreationTime>{{ .created_at }}</CreationTime>
					  <StackId>arn:aws:cloudformation:`+region+`:{{account_id}}:stack/{{.name}}/{{.stack_id}}</StackId>
					  <StackName>{{ .name }}</StackName>
					  <DriftInformation>
						<StackDriftStatus>NOT_CHECKED</StackDriftStatus>
					  </DriftInformation>
					  <StackStatus>{{ .status }}</StackStatus>
						{{#if .status === 'DELETE_COMPLETE'}}
							<DeletionTime>2019-02-03T11:18:10.251Z</DeletionTime>
						{{/if}}
						{{#if .status === 'UPDATE_COMPLETE' }}
							<LastUpdatedTime>2018-10-27T14:16:07.628Z</LastUpdatedTime>
						{{/if}}
					</member>
					{{/stacks}}
				  </StackSummaries>
				</ListStacksResult>
				<ResponseMetadata>
				  <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
				</ResponseMetadata>
			</ListStacksResponse>
			`,
			data: {
			}
		});

		async.waterfall([
			function( cb ) {
				DynamoDB
					.table('cloudformation_stacks')
					.where('account_id').eq(account_id)
					.query(function(err,data) {
						if (err)
							return cb(err)

						ractive.set('stacks', data )
						cb()
					})
			},
		], function(err) {
			if (err)
				return cb(err)

			cb(null, ractive.toHTML() )
		})



	},
}
