//const YAML = require('yaml')
var yaml = require('js-yaml')
var tpl_utils = require('./lib/template_utils')
var buildYamlSchema = require('./lib/schema')
var account_id = '000000000000'


module.exports = {
	CreateStack: function(_POST, DynamoDB, region, cb ) {

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
							return cb({ errorCode: '', message: 'Failed'})

						if (stacks.length)
							return cb({ errorCode: '', message: 'Another stack with the same name exists'})

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

			// save template body
			function( cb ) {
				DynamoDB
					.table('cloudformation_bodies')
					.insert_or_replace({
						account_id: account_id,
						stack_id: stack_id,
						body: _POST.TemplateBody.substring(0, 1024*399 ),
						created_at: new Date().getTime(),
					}, function(err,data) {
						if (err)
							return cb(err)

						cb()
					})
			},

			// parse parameters
			function( cb ) {

				var template_to_process = _POST.TemplateBody

				template_to_process = template_to_process
					//.split('!GetAtt').join('')
					.split('!FindInMap').join( ''  )
					.split('!GetAZs').join( ''  )
					.split('!If').join( ''  )
					//.split('!Join').join( ''  )
					.split('!Select').join( ''  )
					.split('!Split').join( ''  )
					//.split('!Sub').join( ''  )

					.split('!And').join( ''  )
					.split('!Equals').join( ''  )
					.split('!Not').join( ''  )
					.split('!Or').join( ''  )

					.split('!Cidr').join( ''  )
					//.split('!ImportValue').join( ''  )
					.split('!Transform').join( ''  )
					;

				//console.log("try to process",template_to_process)



				try {
					var temp_template = yaml.safeLoad(template_to_process, {
						//filename: path,
						schema: buildYamlSchema(),
						onWarning: function(warning) {
							console.error(warning);
						},
						json: false, // compatibility with JSON.parse behaviour. If true, then duplicate keys in a mapping will override values rather than throwing an error.
					})
					//console.log( JSON.stringify(temp_template, null, "\t") )
				} catch (err) {
					//console.log("yaml failed err=",err, temp_template)
					return cb({ errorCode: err.YAMLException, errorMessage: 'Template failed to parse: ' + err.reason })
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

				// var re = /\!GetAtt\s+([A-Za-z0-9]+)\.([A-Za-z0-9]+)/g
				// var refs = null
				// while ( refs = re.exec(_POST.TemplateBody)) {
				// 	_POST.TemplateBody = _POST.TemplateBody.split(refs[0]).join( get_att(refs[1] ,  refs[2] )  )
				// }



				/*
					@todo:
						Fn::FindInMap
						Fn::GetAZs
						Fn::If
						Fn::Select
						Fn::Split

						Fn::And
						Fn::Equals
						Fn::Not
						Fn::Or

						Fn::Cidr
						Fn::ImportValue
						Fn::Transform

				*/



				_POST.TemplateBody = _POST.TemplateBody
					.split('!FindInMap').join( ''  )
					.split('!GetAZs').join( ''  )
					.split('!If').join( ''  )
					.split('!Select').join( ''  )
					.split('!Split').join( ''  )

					.split('!And').join( ''  )
					.split('!Equals').join( ''  )
					.split('!Not').join( ''  )
					.split('!Or').join( ''  )

					.split('!Cidr').join( ''  )
					//.split('!ImportValue').join( ''  )
					.split('!Transform').join( ''  )
					;

				//console.log(_POST.TemplateBody)

				try {
					template = yaml.safeLoad(_POST.TemplateBody, {
						//filename: path,
						schema: buildYamlSchema(),
						onWarning: function(warning) {
							console.error(warning);
						},
						json: false, // compatibility with JSON.parse behaviour. If true, then duplicate keys in a mapping will override values rather than throwing an error.
					})

					//console.log( JSON.stringify(template, null, "\t") )

				} catch (err) {
					console.log("------------------------ TEMPLATE FAILED -------------------------" )
					console.log(_POST.TemplateBody)
					console.log(err)
					console.log("------------------------------------------------------------------" )
				}

				//yml = YAML.parse( _POST.TemplateBody )

				//console.log( "YML", JSON.stringify(template,null,"\t"))

				cb()
			},


			function(cb) {
				template = tpl_utils.replace_base64_in_obj( template )
				cb()
			},

			function(cb) {

				template = tpl_utils.replace_pseudo_parameters_in_obj( template, {
					region:region,
					account_id: account_id,
					stack_name: _POST.StackName,
					stack_id: `arn:aws:cloudformation:`+region+`:` + account_id + `:stack/` + _POST.StackName + `/` + stack_id
				})
				cb()
			},

			function(cb) {

				var parameters = []
				var resources  = []

				if (!template.hasOwnProperty('Resources'))
					return cb({ errorCode: 'NoResources', errorMessage: 'Template failed to parse: No resources found' })

				if ( typeof template.Resources !== "object")
					return cb({ errorCode: 'InvalidResources', errorMessage: 'Template failed to parse: Resources is not an object' })

				resources = Object.keys(template.Resources);

				if (template.hasOwnProperty('Parameters') && (typeof template.Parameters === "object" )) {
					parameters = Object.keys(template.Parameters)
				}
				
				var unresolved_err = tpl_utils.find_unresolved_refs_in_obj( template.Resources, parameters );
				if ( unresolved_err )
					return cb(unresolved_err)
				
				cb()
			},


			// replace parameters
			function(cb) {
				// we already have parameters as {} with template values filled in from webform parameters
				template = tpl_utils.replace_parameters_in_obj( template, parameters)
				cb()
			},


			function(cb) {
				template = tpl_utils.replace_join_in_obj( template )
				cb()
			},



			function(cb) {
				template = tpl_utils.replace_sub_in_obj( template, {
					'AWS::Region':region,
					'AWS::AccountId': account_id,
					'AWS::StackName': _POST.StackName,
					'AWS::StackId': `arn:aws:cloudformation:`+region+`:` + account_id + `:stack/` + _POST.StackName + `/` + stack_id
				} )
				//console.log("after replace sub", JSON.stringify(template, null, "\t") )
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
						require(respath)(DynamoDB, region, stack_id,res_name, template.Resources[res_name].Type, template.Resources[res_name].Properties, cb )
					} catch (err) {
						if (err && require('fs').existsSync(respath))
							console.log(respath, "failed" )

						require('./Services/default/create.js')(DynamoDB, region,stack_id,res_name, template.Resources[res_name].Type, template.Resources[res_name].Properties, cb )
					}

				}, function(err) {
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
	DeleteStack: function(_POST, DynamoDB, region, cb ) {

		var stack;
		async.waterfall([

			// get stack from db
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
								require(respath)(DynamoDB, region, res.stack_id,res.resource_name, res.type, res.properties, cb  )
							} catch (e) {
								require('./Services/default/delete.js')(DynamoDB, region, res.stack_id,res.resource_name, res.type, res.properties, cb )
							}

						}, function(err) {
							if (err)
								return cb(err)

							cb()
						})

					})

			},




			function( cb ) {
				DynamoDB
					.table('cloudformation_bodies')
					.where('account_id').eq(account_id)
					.where('stack_id').eq(stack.stack_id)
					.delete(function(err) {
						cb(err)
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
	ListStacks: function(_POST, DynamoDB, region, cb ) {

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



	GetTemplateSummary: function(_POST, DynamoDB, region, cb ) {


		// Step1, replace pseudo parameters
		var TemplateBody = JSON.parse(JSON.stringify(_POST.TemplateBody))
		//TemplateBody = tpl_utils.remove_comments(TemplateBody) 

		var template_to_process = JSON.parse(JSON.stringify(_POST.TemplateBody))


		// Step2, remove all Cloudformation specific func and try to validate yaml
		// var template_to_process = tpl_utils.cleanup_cloudformation_specific(TemplateBody)


		//console.log("before yaml parse, template = ", template_to_process )

		try {
			var temp_template = yaml.safeLoad(template_to_process, {
				//filename: path,
				schema: buildYamlSchema(),
				onWarning: function(warning) {
					console.error(warning);
				},
				json: false, // compatibility with JSON.parse behaviour. If true, then duplicate keys in a mapping will override values rather than throwing an error.
			})
			//console.log("template parsed to ", JSON.stringify(temp_template, null, "\t"))
		} catch (err) {
			return cb({ errorCode: err.YAMLException, errorMessage: 'Template failed to parse: ' + err.reason })
		}


		var parameters = []
		var resources  = []

		if (!temp_template.hasOwnProperty('Resources'))
			return cb({ errorCode: 'NoResources', errorMessage: 'Template failed to parse: No resources found' })

		if ( typeof temp_template.Resources !== "object")
			return cb({ errorCode: 'InvalidResources', errorMessage: 'Template failed to parse: Resources is not an object' })

		resources = Object.keys(temp_template.Resources);

		if (temp_template.hasOwnProperty('Parameters') && (typeof temp_template.Parameters === "object" )) {
			parameters = Object.keys(temp_template.Parameters)
		}

		temp_template = tpl_utils.replace_pseudo_parameters_in_obj( temp_template, {
			region:region,
			account_id: account_id,
			stack_name: 'StackNamePlaceholder',
			stack_id: 'StackIdPlaceholder'
		})

		var unresolved_err = tpl_utils.find_unresolved_refs_in_obj( temp_template.Resources, parameters );
		if ( unresolved_err )
			return cb(unresolved_err)



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
								{{#if .AllowedValues }}
									<ParameterConstraints>

										<AllowedValues>
											{{#.AllowedValues}}
											<member>{{ . }}</member>
											{{/.AllowedValues}}
										</AllowedValues>
									</ParameterConstraints>
								{{else}}
									<ParameterConstraints/>
								{{/if}}
								<NoEcho>{{.NoEcho}}</NoEcho>
								<ParameterKey>{{.ParameterKey}}</ParameterKey>
								{{#if .Default }}
								<DefaultValue>{{.Default}}</DefaultValue>
								{{/if}}
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

					var AllowedValues = undefined;
					if (temp_template.Parameters[pk].hasOwnProperty('AllowedValues') && Array.isArray(temp_template.Parameters[pk].AllowedValues))
						AllowedValues = temp_template.Parameters[pk].AllowedValues;

					return {
						ParameterKey: pk,
						ParameterType: temp_template.Parameters[pk].Type,
						Default: temp_template.Parameters[pk].Default,
						AllowedValues: AllowedValues,
					}
				})
				:
				[],
			}
		});

		cb(null, ractive.toHTML())

	},

	GetTemplate: function(_POST, DynamoDB, region, cb ) {


		var account_id = '000000000000'

		var stack;
		var body;
		async.waterfall([

			// get stack from db
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

			function( cb ) {
				DynamoDB
					.table('cloudformation_bodies')
					.where('account_id').eq(account_id)
					.where('stack_id').eq(stack.stack_id)
					.get(function(err,dbbody) {
						if (err)
							return cb(err)

						if (!Object.keys(dbbody).length)
							return cb()

						body=dbbody.body;
						cb()
					})
			},


		], function(err) {
			if (err)
				return cb(err)

			cb(null, `
				<GetTemplateResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
					<GetTemplateResult>
						<TemplateBody>` + body.split("<").join("&lt;").split(">").join("&gt;").split('"').join("&#34;").split("'").join("&#39;") + `
						</TemplateBody>
						<StagesAvailable>
							<member>Original</member>
							<member>Processed</member>
						</StagesAvailable>
					</GetTemplateResult>
					<ResponseMetadata>
						<RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
					</ResponseMetadata>
				</GetTemplateResponse>
			`)
		})
	},





	DescribeStacks: function(_POST, DynamoDB, region, cb ) {


		var account_id = '000000000000'

		var stack;
		var parameters;

		async.waterfall([

			// get stack from db
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
							return cb({errorCode: 'STACK_NOT_FOUND'})

						stack=dbstacks[0];
						cb()
					})
			},

			function(cb) {
				DynamoDB
					.table('cloudformation_parameters')
					.where('stack_id').eq(stack.stack_id)
					.query(function(err,dbparams) {
						if (err)
							return cb(err)

						parameters = dbparams;
						cb()
					})
			},

		], function(err) {
			if (err)
				return cb(err)


			var ractive = new Ractive({
				template: `
					<DescribeStacksResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
					  <DescribeStacksResult>
					    <Stacks>
					      <member>
					        <Capabilities>
					          <member>CAPABILITY_IAM</member>
					        </Capabilities>
					        <CreationTime>` + (new Date(stack.created_at).toISOString()) + `</CreationTime>
					        <NotificationARNs/>
							<StackId>arn:aws:cloudformation:`+region+`:` + account_id + `:stack/` + stack.name + `/` + stack.stack_id + `</StackId>
					        <StackName>` + stack.name + `</StackName>
					        <StackStatus>` + stack.status + `</StackStatus>
					        <DisableRollback>false</DisableRollback>
					        <Tags/>
					        <RollbackConfiguration>
					          <RollbackTriggers/>
					        </RollbackConfiguration>
					        <DriftInformation>
					          <StackDriftStatus>NOT_CHECKED</StackDriftStatus>
					        </DriftInformation>
					        <EnableTerminationProtection>false</EnableTerminationProtection>
					        <Parameters>
								{{#parameters}}
									<member>
										<ParameterKey>{{.key}}</ParameterKey>
										<ParameterValue>{{.value}}</ParameterValue>
									</member>
								{{/parameters}}
					        </Parameters>
					      </member>
					    </Stacks>
					  </DescribeStacksResult>
					  <ResponseMetadata>
					    <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
					  </ResponseMetadata>
					</DescribeStacksResponse>
				`,
				data: {
					parameters: parameters
				}
			});

			cb(null, ractive.toHTML())


		})
	},


	ListStackResources: function(_POST, DynamoDB, region, cb ) {


		var account_id = '000000000000'

		var stack;
		var resources;

		async.waterfall([

			// get stack from db
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
							return cb({errorCode: 'STACK_NOT_FOUND'})

						stack=dbstacks[0];
						cb()
					})
			},

			function(cb) {
				DynamoDB
					.table('cloudformation_resources')
					.where('stack_id').eq(stack.stack_id)
					.query(function(err,dbresources) {
						if (err)
							return cb(err)

						resources = dbresources;
						cb()
					})
			},

		], function(err) {
			if (err)
				return cb(err)

			var ractive = new Ractive({
				template: `
					<ListStackResourcesResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
					  <ListStackResourcesResult>
					    <StackResourceSummaries>
							{{#resources}}
					      <member>
					        <LastUpdatedTimestamp>{{ .updated_at }}</LastUpdatedTimestamp>
					        <PhysicalResourceId>{{.phisical_id}}</PhysicalResourceId>
					        <ResourceStatus>{{.status}}</ResourceStatus>
					        <DriftInformation>
					          <StackResourceDriftStatus>NOT_CHECKED</StackResourceDriftStatus>
					        </DriftInformation>
					        <LogicalResourceId>{{.resource_name}}</LogicalResourceId>
					        <ResourceType>{{.type}}</ResourceType>
					      </member>
							{{/resources}}
					    </StackResourceSummaries>
					  </ListStackResourcesResult>
					  <ResponseMetadata>
					    <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
					  </ResponseMetadata>
					</ListStackResourcesResponse>

				`,
				data: {
					resources: resources
				}
			});

			cb(null, ractive.toHTML())


		})
	},
	DescribeStackEvents: function(_POST, DynamoDB, region, cb ) {
		return cb({errorCode: 'NOT_IMPLEMENTED'})
	}

}
