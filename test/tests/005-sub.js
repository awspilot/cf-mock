
describe('!Sub [ String, { Var1Name: Var1Value, Var2Name: Var2Value } ]', function () {
	it('CreateStack', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl_prefix:
        Type: String
        Default: my_tbl_
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Sub [ '\${tbl_prefix}\${AWS::Region}-\${AWS::AccountId}-\${AWS::StackName}', { tbl_prefix: !Ref tbl_prefix } ]
            BillingMode: PAY_PER_REQUEST
            AttributeDefinitions:
                -
                  AttributeName: field
                  AttributeType: S
            KeySchema:
                -
                  AttributeName: field
                  KeyType: HASH
`,
			};
		cloudformation.createStack(params, function(err, data) {

			if (err)
				throw err;
		
			setTimeout(function() {
				done()
			}, 2000)
		});
	})
	it('ListStackResources', function(done) {
		cloudformation.listStackResources({ StackName: 'STRING_VALUE', }, function(err, data) {
	
			if (err)
				throw err;
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'my_tbl_us-east-2-000000000000-STRING_VALUE' )
				throw '!Join failed'
	
			done()
		});
	})
	it('DeleteStack', function(done) {
		cloudformation.deleteStack({ StackName: 'STRING_VALUE', }, function(err, data) {
			if (err)
				throw err;
	
			done()
		});
	})


})


