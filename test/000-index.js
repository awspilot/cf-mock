AWS = require('aws-sdk')
var cloudformation = new AWS.CloudFormation({
	endpoint: 'http://localhost:10001',
	region: 'us-east-1',
	accessKeyId: "myKeyId",
	secretAccessKey: "secretKey",
});
process.env.DYNAMODB_ENDPOINT="http://localhost:8000"

require("../src/index")

describe('init', function () {
	it('waiting for cf to start', function(done) {
		setTimeout(function() {
			done()
		},10000)
	})
	it('waiting for cf to start', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
		  // ClientRequestToken: 'STRING_VALUE',
		  // DisableRollback: true || false,
		  // EnableTerminationProtection: true || false,
		  // NotificationARNs: [
		  //   'STRING_VALUE',
		  //   /* more items */
		  // ],
		  // OnFailure: DO_NOTHING | ROLLBACK | DELETE,
		  // Parameters: [
		  //   {
		  //     ParameterKey: 'STRING_VALUE',
		  //     ParameterValue: 'STRING_VALUE',
		  //     ResolvedValue: 'STRING_VALUE',
		  //     UsePreviousValue: true || false
		  //   },
		  //   /* more items */
		  // ],
		  // TemplateBody: 'STRING_VALUE',
		  // TemplateURL: 'STRING_VALUE',
		  // TimeoutInMinutes: 0
		};
		cloudformation.createStack(params, function(err, data) {
			console.log(err,data)
			done()
		});
	})
})
