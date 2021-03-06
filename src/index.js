var http = require('http')
var qs = require('qs')
form_parameters = require('./lib/form_parameters')
async=require('async')
var AWS = require('aws-sdk')
Ractive = require('ractive')
Ractive.DEBUG = false;
var url = require('url');
DynamodbFactory = require('@awspilot/dynamodb')
DynamodbFactory.config( {empty_string_replace_as: "\0" } );





var cf=require('./cf')

async.waterfall([



	function( cb ) {
		const requestHandler = function(request, response) {
			if (process.env.CF_LOG_REQUESTS)
				console.log( "[cloudformation]", request.method, request.url )

			if (request.headers.origin) {
				response.setHeader('Access-Control-Allow-Origin', '*')

				if (request.method == 'OPTIONS') {
					if (request.headers['access-control-request-headers'])
						response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers'])

					if (request.headers['access-control-request-method'])
						response.setHeader('Access-Control-Allow-Methods', request.headers['access-control-request-method'])

					response.setHeader('Access-Control-Max-Age', 172800)
					return response.end('')
				}

				response.setHeader('Access-Control-Expose-Headers', 'x-amzn-RequestId,x-amzn-ErrorType,x-amz-request-id,x-amz-id-2,x-amzn-ErrorMessage,Date')
			}




			//console.log(request.method, request.url)
			//console.log(request.headers)

			var body = '';
			request.on('data', function(chunk) {
				body += chunk.toString(); // convert Buffer to string
			});
			request.on('end', function() {

				var _POST = qs.parse(body)
				var region = (url.parse(request.url, true).query || {}).region
				//console.log("region from url=", region )

				// use region from signature
				if (!region) {
					try {
						var auth_re = /(?<algorithm>[A-Z0-9\-]+)\ Credential=(?<accesskey>[^\/]+)\/(?<unknown1>[^\/]+)\/(?<region>[^\/]+)\/([^\/]+)\/([^,]+), SignedHeaders=(?<signed_headers>[^,]+), Signature=(?<signature>[a-z0-9]+)/
						var auth = (request.headers['authorization'] || '') .match( auth_re );
						if (  auth === null )
							return response.end('Failed auth');

						region = auth.groups.region
					} catch (e) {
						region = 'us-east-1';
					}
				}

				var DynamoDB = new DynamodbFactory(
					new AWS.DynamoDB({
						endpoint:        process.env.CF_DYNAMODB_ENDPOINT,
						accessKeyId:     process.env.CF_DYNAMODB_KEY,
						secretAccessKey: process.env.CF_DYNAMODB_SECRET,
						region:          (process.env.CF_DYNAMODB_REGION_PREFIX || '') + region,
					})
				)




				async.waterfall([
					// create table stacks if needed
					function( cb ){
						DynamoDB.client.describeTable({TableName: 'cloudformation_stacks'}, function(err, data) {
							if (!err) {
								return cb()
							}


							if ( err.code === 'ResourceNotFoundException') {
								// create the table
								DynamoDB.client.createTable({
									TableName: "cloudformation_stacks",
									AttributeDefinitions: [
										{
											AttributeName: "account_id",
											AttributeType: "S"
										},
										{
											AttributeName: "stack_id",
											AttributeType: "S"
										},
										{
											AttributeName: "name",
											AttributeType: "S"
										},
									],
									KeySchema: [
										{
											AttributeName: "account_id",
											KeyType: "HASH"
										},
										{
											AttributeName: "stack_id",
											KeyType: "RANGE"
										}
									],
									ProvisionedThroughput: {
										ReadCapacityUnits: 5,
										WriteCapacityUnits: 5
									},
									GlobalSecondaryIndexes: [{
										IndexName: 'name-index',
										KeySchema: [
											{
												AttributeName: 'account_id',
												KeyType: 'HASH'
											},
											{
												AttributeName: 'name',
												KeyType: 'RANGE'
											},
										],
										Projection: {
											ProjectionType: 'ALL'
										},
										ProvisionedThroughput: {
											ReadCapacityUnits: 5,
											WriteCapacityUnits: 5
										}
									}],
								}, function(err,data) {
									if (err) {
										return cb(err)
									}

									// @todo: wait for table to be active
									setTimeout(cb,2000)

								})
								return
							} else {
								throw err
							}

						})
					},


					// create table stack_parameters if needed
					function( cb ){
						DynamoDB.client.describeTable({TableName: 'cloudformation_parameters'}, function(err, data) {
							if (!err) {
								return cb()
							}


							if ( err.code === 'ResourceNotFoundException') {
								// create the table
								DynamoDB.client.createTable({
									TableName: "cloudformation_parameters",
									AttributeDefinitions: [
										{
											AttributeName: "stack_id",
											AttributeType: "S"
										},
										{
											AttributeName: "key",
											AttributeType: "S"
										},
									],
									KeySchema: [
										{
											AttributeName: "stack_id",
											KeyType: "HASH"
										},
										{
											AttributeName: "key",
											KeyType: "RANGE"
										}
									],
									ProvisionedThroughput: {
										ReadCapacityUnits: 5,
										WriteCapacityUnits: 5
									},
								}, function(err,data) {
									if (err) {
										return cb(err)
									}

									cb()
								})
								return
							} else {
								throw err
							}

						})
					},


					// create table cloudformation_resources if needed
					function( cb ){
						DynamoDB.client.describeTable({TableName: 'cloudformation_resources'}, function(err, data) {
							if (!err) {

								return cb()
							}


							if ( err.code === 'ResourceNotFoundException') {
								// create the table
								DynamoDB.client.createTable({
									TableName: "cloudformation_resources",
									AttributeDefinitions: [
										{
											AttributeName: "stack_id",
											AttributeType: "S"
										},
										{
											AttributeName: "resource_name",
											AttributeType: "S"
										},
									],
									KeySchema: [
										{
											AttributeName: "stack_id",
											KeyType: "HASH"
										},
										{
											AttributeName: "resource_name",
											KeyType: "RANGE"
										}
									],
									ProvisionedThroughput: {
										ReadCapacityUnits: 5,
										WriteCapacityUnits: 5
									},
								}, function(err,data) {
									if (err) {
										return cb(err)
									}


									cb()
								})
								return
							} else {
								throw err
							}

						})
					},



					// create table cloudformation_bodies if needed
					function( cb ){
						DynamoDB.client.describeTable({TableName: 'cloudformation_bodies'}, function(err, data) {
							if (!err) {

								return cb()
							}


							if ( err.code === 'ResourceNotFoundException') {
								// create the table
								DynamoDB.client.createTable({
									TableName: "cloudformation_bodies",
									AttributeDefinitions: [
										{
											AttributeName: "account_id",
											AttributeType: "S"
										},
										{
											AttributeName: "stack_id",
											AttributeType: "S"
										},
									],
									KeySchema: [
										{
											AttributeName: "account_id",
											KeyType: "HASH"
										},
										{
											AttributeName: "stack_id",
											KeyType: "RANGE"
										},
									],
									ProvisionedThroughput: {
										ReadCapacityUnits: 5,
										WriteCapacityUnits: 5
									},
								}, function(err,data) {
									if (err) {
										return cb(err)
									}


									cb()
								})
								return
							} else {
								throw err
							}

						})
					},






				], function() {

					if (!cf.hasOwnProperty(_POST.Action)) {
						response.statusCode = 403
						return response.end(`
							<ErrorResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
								<Error>
									<Type>Sender</Type>
									<Code>NOT_IMPLEMENTED</Code>
									<Message>Not Implemented: ` + _POST.Action + `</Message>
								</Error>
								<RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
							</ErrorResponse>
						`)
					}

					cf[_POST.Action](_POST,DynamoDB, region,function(err,data) {
						//response.setHeader('Content-Type', 'application/x-www-form-urlencoded' )
						response.setHeader('Content-Type', 'application/xml');
						//response.setHeader('x-amzn-RequestId', uuid.v1())
						//response.setHeader('x-amz-id-2', crypto.randomBytes(72).toString('base64'))

						if (err) {
							response.statusCode = 403

							var ret = `
								<ErrorResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
									<Error>
										<Type>Sender</Type>
										<Code>` + err.errorCode + `</Code>
										<Message>` + err.errorMessage + `</Message>
										<RawApiPayload>` + err.RawApiPayload + `</RawApiPayload>
										<RawApiError>` + err.RawApiError + `</RawApiError>
									</Error>
									<RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
								</ErrorResponse>
							`;

							response.end(ret)
							return;
						}
						//response.setHeader('Content-Length', qs.stringify(data).length )
						//response.end(qs.stringify(data))
						response.end(data)
					})

				})


			});

		}
		const server = http.createServer(requestHandler)
		server.listen(process.env.PORT || 10001,function(err) {
			if (err) {
				console.log("Failed listening ", err )
				process.exit()
			}

			console.log("Starting Cloudformation Mock on port ", process.env.PORT || 10001 )

		})
	},
], function(err) {
	if (err) {
		console.log("error" ,err )
		return process.exit()
	}

})
