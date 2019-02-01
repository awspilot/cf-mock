var http = require('http')
var parse = require('querystring').parse

var async=require('async')
var AWS = require('aws-sdk')


const DynamodbFactory = require('@awspilot/dynamodb')
DynamoDB = new DynamodbFactory(
	new AWS.DynamoDB({
		endpoint: 'http://localhost:8000',
		accessKeyId: "myKeyId",
		secretAccessKey: "secret",
		"region": "us-east-1"
	})
)

async.waterfall([

	// create table stacks if needed
	function( cb ){
		DynamoDB.client.describeTable({TableName: 'cloudformation_stacks'}, function(err, data) {
			if (err.code !== 'ResourceNotFoundException')
				return cb()

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
			}, function(err,data) {
				if (err)
					return cb(err)

				console.log(err,data)
				cb()
			})
		})
	},







	function( cb ) {
		const requestHandler = function(request, response) {
			console.log("-----------------")
			console.log(request.method, request.url)
			console.log(request.headers)

			var body = '';
			request.on('data', function(chunk) {
				body += chunk.toString(); // convert Buffer to string
			});
			request.on('end', function() {
				var _POST = parse(body)
				console.log("got body=",_POST);

				//cf[_POST.Action](_POST,function() {

				//})
			});

			response.end('')
		}
		const server = http.createServer(requestHandler)
		server.listen(10001,function(err) {
			console.log("listen error", err)
		})
	},
], function(err) {
	if (err)
		return process.exit()


})
