fs  = require('fs')
AWS = require('aws-sdk')
var cloudformation = new AWS.CloudFormation({
	endpoint: 'http://localhost:10001/us-east-1',
	region: 'us-east-1',
	accessKeyId: "myKeyId",
	secretAccessKey: "secretKey",
});
process.env.DYNAMODB_ENDPOINT="http://localhost:8000"
// process.env.DYNAMODB_KEY="myKeyId"
// process.env.DYNAMODB_SECRET="secretKey"
// process.env.DYNAMODB_REGION="us-east-1"


require("../src/index")

describe('init', function () {
	it('waiting for cf to start', function(done) {
		setTimeout(function() {
			done()
		},9000)
	})
	it('CreateStack', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
		  // ClientRequestToken: 'STRING_VALUE',
		  // DisableRollback: true || false,
		  // EnableTerminationProtection: true || false,
			NotificationARNs: [
				'STRING_VALUE',
				'STRING_VALUE2',
			],
		  // OnFailure: DO_NOTHING | ROLLBACK | DELETE,
			Parameters: [
				{
					ParameterKey: 'OrgDomain',
					ParameterValue: 'testdomain.com',
				},
			],
			TemplateBody: fs.readFileSync('./test/yamls/1.yaml','UTF-8'),
		  // TemplateURL: 'STRING_VALUE',
		  // TimeoutInMinutes: 0
		};
		cloudformation.createStack(params, function(err, data) {
			console.log("CreateStack",err,data)
			setTimeout(function() {
				done()
			}, 5000)
		});
	})

	it('ListStacks', function(done) {
		var params = {
		//  NextToken: 'STRING_VALUE',
		//  StackStatusFilter: [
		//    CREATE_IN_PROGRESS | CREATE_FAILED | CREATE_COMPLETE | ROLLBACK_IN_PROGRESS | ROLLBACK_FAILED | ROLLBACK_COMPLETE | DELETE_IN_PROGRESS | DELETE_FAILED | DELETE_COMPLETE | UPDATE_IN_PROGRESS | UPDATE_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_COMPLETE | UPDATE_ROLLBACK_IN_PROGRESS | UPDATE_ROLLBACK_FAILED | UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_ROLLBACK_COMPLETE | REVIEW_IN_PROGRESS,
		//    /* more items */
		//  ]
		};
		cloudformation.listStacks(params, function(err, data) {
			console.log("ListStacks",err,data)
			done()
		});

	})


	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
			// ClientRequestToken: 'STRING_VALUE',
			// RetainResources: [
			//   'STRING_VALUE',
			//   /* more items */
			// ],
			// RoleARN: 'STRING_VALUE'
		};
		cloudformation.deleteStack(params, function(err, data) {
			console.log("deleteStack",err,data)
			done()
		});
	})



})
