var http = require('http')
var qs = require('qs')
form_parameters = require('./lib/form_parameters')
async=require('async')
var AWS = require('aws-sdk')
Ractive = require('ractive')
Ractive.DEBUG = false;

const DynamodbFactory = require('@awspilot/dynamodb')



ClientsDynamoDB = new DynamodbFactory(
	new AWS.DynamoDB({
		endpoint: process.env.DYNAMODB_ENDPOINT,
		accessKeyId: "myKeyId",
		secretAccessKey: "secretKey",
		region: "us-east-1"
	})
)


var cf=require('./cf')

async.waterfall([



	function( cb ) {
		const requestHandler = function(request, response) {
			if (request.headers.origin) {
				response.setHeader('Access-Control-Allow-Origin', '*')

				if (reqest.method == 'OPTIONS') {
					if (reqest.headers['access-control-request-headers'])
						response.setHeader('Access-Control-Allow-Headers', reqest.headers['access-control-request-headers'])

					if (reqest.headers['access-control-request-method'])
						response.setHeader('Access-Control-Allow-Methods', reqest.headers['access-control-request-method'])

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
				var region = request.url.slice(1)

				var DynamoDB = new DynamodbFactory(
					new AWS.DynamoDB({
						endpoint: process.env.DYNAMODB_ENDPOINT,
						accessKeyId: "myKeyId",
						secretAccessKey: "secretKey",
						region: region,
					})
				)

				async.waterfall([
					// create table stacks if needed
					function( cb ){
						DynamoDB.client.describeTable({TableName: 'cloudformation_stacks'}, function(err, data) {
							if (!err) {
								console.log("table cloudformation_stacks exists")
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

									console.log("table cloudformation_stacks created")
									cb()
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
								console.log("table cloudformation_parameters exists")
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

									console.log("table cloudformation_parameters created")
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
								console.log("table cloudformation_resources exists")
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

									console.log("table cloudformation_resources created")
									cb()
								})
								return
							} else {
								throw err
							}

						})
					},

				], function() {

					cf[_POST.Action](_POST,DynamoDB,function(err,data) {
						//response.setHeader('Content-Type', 'application/x-www-form-urlencoded' )
						response.setHeader('Content-Type', 'application/xml');
						//response.setHeader('x-amzn-RequestId', uuid.v1())
						//response.setHeader('x-amz-id-2', crypto.randomBytes(72).toString('base64'))

						if (err) {
							response.statusCode = 403

							response.end(`
								<ErrorResponse xmlns="http://cloudformation.amazonaws.com/doc/2010-05-15/">
								  <Error>
								    <Type>Sender</Type>
								    <Code>` + err.code + `</Code>
								    <Message>` + err.message + `</Message>
								  </Error>
								  <RequestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</RequestId>
								</ErrorResponse>
							`)
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
		server.listen(10001,function(err) {
			console.log("listen error", err)
		})
	},
], function(err) {
	if (err) {
		console.log("error" ,err )
		return process.exit()
	}

})
