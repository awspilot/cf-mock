fs  = require('fs')
AWS = require('aws-sdk')
cloudformation = new AWS.CloudFormation({
	endpoint: 'http://localhost:10001/?region=us-east-2',

	// region is needed but not used since its normally used to generate the endpoint, but we've already added it to the endpoint
	region: 'us-east-2',

	//
	accessKeyId: "myKeyId",
	secretAccessKey: "secretKey",
});


// cloudformation dynamodb
process.env.CF_DYNAMODB_ENDPOINT="http://localhost:8000"
process.env.CF_DYNAMODB_KEY="myKeyId"
process.env.CF_DYNAMODB_SECRET="secretKey"
// process.env.CF_DYNAMODB_REGION - is taken from the cloudformation endpoint (/us-east-2)

process.env.DYNAMODB_ENDPOINT="http://localhost:8000"
process.env.DYNAMODB_KEY="myKeyId"
process.env.DYNAMODB_SECRET="secretKey"
// process.env.DYNAMODB_REGION - is taken from the cloudformation endpoint (/us-east-2)
