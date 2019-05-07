
describe('!Split [ delimiter, source_string ]', function () {
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
            TableName: !Join [ '_', !Split [ '-', !Ref AWS::Region ] ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'us_east_2' )
				throw '!Split failed'
	
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