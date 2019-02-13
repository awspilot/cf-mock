//const YAML = require('yaml')
var yaml = require('js-yaml')


module.exports = {
	CreateStack: function(_POST, DynamoDB, ClientsDynamoDB, region, cb ) {
		var account_id = '000000000000'
		var stack_id   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) { var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); });
		var template;
		var parameters = {}

		form_parameters.extract_param('Parameters', _POST )
		form_parameters.extract_param('NotificationARNs', _POST )

		//console.log( "CreateStack", JSON.stringify(_POST,null,"\t"))

		if (!_POST.hasOwnProperty('Parameters'))
			_POST.Parameters = []

		// funcs https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html
		// pseudo parameters https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html
		var resolve_global = function( param ) {
			return "unsupported " + param;
		}

		var get_att = function( res, attr ) {
			return "not implemented GetAttribute( "+res+" , "+attr+" )";
		}

		var resolve_parameter = function( pname ) {
			var ret = '';
			if (parameters.hasOwnProperty(pname))
				ret = parameters[pname];

			if (ret === '')
				return "''"

			return ret;
		}

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

			// parse parameters
			function( cb ) {

				var template_to_process = _POST.TemplateBody

				// !Sub \n ( with parameters on the next line )
				var re = /\!Sub\s?$/gm
				var refs = null
				while ( refs = re.exec(template_to_process)) {
					template_to_process =template_to_process.split(refs[0]).join('')
				}

				template_to_process = template_to_process
					.split('!Ref').join('references')
					.split('!GetAtt').join('getattribute')
					.split('!Base64').join( 'Base64'  )
					.split('!FindInMap').join( 'FindInMap'  )
					.split('!GetAZs').join( 'GetAZs'  )
					.split('!If').join( 'If'  )
					.split('!Join').join( 'Join'  )
					.split('!Select').join( 'Select'  )
					.split('!Split').join( 'Split'  )
					.split('!Sub').join( 'Sub'  )

					.split('!And').join( 'And'  )
					.split('!Equals').join( 'Equals'  )
					.split('!Not').join( 'Not'  )
					.split('!Or').join( 'Or'  )

					.split('!Cidr').join( 'Cidr'  )
					.split('!ImportValue').join( 'ImportValue'  )
					.split('!Transform').join( 'Transform'  )
					;

				try {
					var temp_template = yaml.safeLoad(template_to_process)
				} catch (e) {
					return cb({ code: '', message: 'Template failed to parse'})
				}
				if ( !temp_template.hasOwnProperty('Parameters'))
					return cb()

				if (typeof temp_template.Parameters !== 'object' )
					return cb()

				async.each(Object.keys(temp_template.Parameters), function( p, cb) {
					// @todo: add default value

					var value = null
					if ( temp_template.Parameters[p].hasOwnProperty('Default') )
						value = temp_template.Parameters[p].Default;

					// override parameter values with supplied values
					_POST.Parameters.map(function(pp) {
						if ( pp.ParameterKey === p )
							value = pp.ParameterValue

						return pp;
					})

					parameters[p] = value;
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
				})
			},

			// @todo: validate using https://d201a2mn26r7lk.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json


			function( cb ) {
				// will parse json aswell

				// !Ref "XXX:YYY:ZZZ"
				var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( resolve_global(refs[1] + '::' + refs[2] + '::' + refs[3])  )
				}

				// !Ref "AWS::Region"
				var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( resolve_global(refs[1] + '::' + refs[2])  )
				}


				// !Ref XXX:YYY:ZZZ
				var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( resolve_global(refs[1] + '::' + refs[2] + '::' + refs[3])  )
				}

				// !Ref AWS::Region
				var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( resolve_global(refs[1] + '::' + refs[2] )  )
				}

				// !Ref "XXX"
				var re = /\!Ref\s+\"([a-zA-Z0-9]+)\"/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join(resolve_parameter(refs[1]))
				}

				// !Ref XXX
				var re = /\!Ref\s+([a-zA-Z0-9]+)$/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join(resolve_parameter(refs[1]))
				}


				var re = /\!GetAtt\s+([A-Za-z0-9]+)\.([A-Za-z0-9]+)\s?$/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( get_att(refs[1] ,  refs[2] )  )
				}


				/*
					@todo:
						Fn::Base64
						Fn::FindInMap
						Fn::GetAZs
						Fn::If
						Fn::Join
						Fn::Select
						Fn::Split
						Fn::Sub

						Fn::And
						Fn::Equals
						Fn::Not
						Fn::Or

						Fn::Cidr
						Fn::ImportValue
						Fn::Transform


				*/

				// !Sub \n ( with parameters on the next line )
				var re = /\!Sub\s?$/gm
				var refs = null
				while ( refs = re.exec(_POST.TemplateBody)) {
					_POST.TemplateBody =_POST.TemplateBody.split(refs[0]).join('')
				}


				_POST.TemplateBody = _POST.TemplateBody
					.split('!Base64').join( 'unhandled Base64'  )
					.split('!FindInMap').join( 'unhandled FindInMap'  )
					.split('!GetAZs').join( 'unhandled GetAZs'  )
					.split('!If').join( 'unhandled If'  )
					.split('!Join').join( 'unhandled Join'  )
					.split('!Select').join( 'unhandled Select'  )
					.split('!Split').join( 'unhandled Split'  )
					.split('!Sub').join( 'unhandled Sub'  )

					.split('!And').join( 'unhandled And'  )
					.split('!Equals').join( 'unhandled Equals'  )
					.split('!Not').join( 'unhandled Not'  )
					.split('!Or').join( 'unhandled Or'  )

					.split('!Cidr').join( 'unhandled Cidr'  )
					.split('!ImportValue').join( 'unhandled ImportValue'  )
					.split('!Transform').join( 'unhandled Transform'  )
					;

				try {
					template = yaml.safeLoad( _POST.TemplateBody )
				} catch (e) {

				}

				//yml = YAML.parse( _POST.TemplateBody )

				//console.log( "YML", JSON.stringify(template,null,"\t"))

				cb()
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
		var ractive = new Ractive({
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


	/* { Action: 'GetTemplateSummary', TemplateBody: 'STRING', Version: '2010-05-15' } */
	GetTemplateSummary: function(_POST, DynamoDB, ClientsDynamoDB, region, cb ) {

		var template_to_process = _POST.TemplateBody

		// !Sub \n ( with parameters on the next line )
		var re = /\!Sub\s?$/gm
		var refs = null
		while ( refs = re.exec(template_to_process)) {
			template_to_process =template_to_process.split(refs[0]).join('')
		}

		template_to_process = template_to_process
			.split('!Ref').join('references')
			.split('!GetAtt').join('getattribute')
			.split('!Base64').join( 'Base64'  )
			.split('!FindInMap').join( 'FindInMap'  )
			.split('!GetAZs').join( 'GetAZs'  )
			.split('!If').join( 'If'  )
			.split('!Join').join( 'Join'  )
			.split('!Select').join( 'Select'  )
			.split('!Split').join( 'Split'  )
			.split('!Sub').join( 'Sub'  )

			.split('!And').join( 'And'  )
			.split('!Equals').join( 'Equals'  )
			.split('!Not').join( 'Not'  )
			.split('!Or').join( 'Or'  )

			.split('!Cidr').join( 'Cidr'  )
			.split('!ImportValue').join( 'ImportValue'  )
			.split('!Transform').join( 'Transform'  )
			;

		try {
			var temp_template = yaml.safeLoad(template_to_process)
		} catch (e) {
			return cb({ code: '', message: 'Template failed to parse'})
		}

		if ( !temp_template.hasOwnProperty('Parameters'))
			return cb()





		var ractive = new Ractive({
			template: `
				<GetTemplateSummaryResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
					<Version>2010-09-09</Version>
					<GetTemplateSummaryResult>
						<ResourceTypes>
							{{#resource_types}}
								<member>{{ . }}</member>
							{{/resource_types}}
						</ResourceTypes>
						<Metadata></Metadata>

						{{!
							<Capabilities>
								<member>CAPABILITY_IAM</member>
							</Capabilities>
							<CapabilitiesReason>The following resource(s) require capabilities: [AWS::IAM::Role]</CapabilitiesReason>
						}}


						<Parameters>
							{{#parameters}}
							<member>
								<ParameterType>{{.ParameterType}}</ParameterType>
								<ParameterConstraints/>
								<NoEcho>{{.NoEcho}}</NoEcho>
								<ParameterKey>{{.ParameterKey}}</ParameterKey>
							</member>
							{{/parameters}}
						</Parameters>
					</GetTemplateSummaryResult>
					<ResponseMetadata>
						<RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
					</ResponseMetadata>
				</GetTemplateSummaryResponse>
			`,
			data: {
				resource_types: temp_template.hasOwnProperty('Resources') ?
				Object.keys(temp_template.Resources).map(function(r) {
					return temp_template.Resources[r].Type
				})
				:
				[],
				parameters: temp_template.hasOwnProperty('Parameters') ?
				Object.keys(temp_template.Parameters).map(function(pk) {
					return {
						ParameterKey: pk,
						ParameterType: temp_template.Parameters[pk].Type,
					}
				})
				:
				[],
			}
		});

		cb(null, ractive.toHTML())

	},
}
