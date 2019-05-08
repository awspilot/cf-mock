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


DynamodbFactory = require('@awspilot/dynamodb')
DynamodbFactory.config( {empty_string_replace_as: "\0" } );

ClientsDynamoDB = new DynamodbFactory(
	new AWS.DynamoDB({
		endpoint:        process.env.DYNAMODB_ENDPOINT,
		accessKeyId:     process.env.DYNAMODB_KEY,
		secretAccessKey: process.env.DYNAMODB_SECRET,
		region:          'us-east-2',
	})
);

// connection to IAM, 
process.env.CF_IAM_ENDPOINT="http://localhost:10006"
process.env.IAM_KEY="myKeyId"
process.env.IAM_SECRET="secretKey"



