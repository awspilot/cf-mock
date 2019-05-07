
describe('!GetAZs string', function () {
	it('!GetAZs us-east-1', function(done) {

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
            TableName: !Join [ '_', !GetAZs 'us-east-1' ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'us-east-1a_us-east-1b_us-east-1c' )
				throw '!GetAZs failed'
	
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










	it('!GetAZs ""', function(done) {

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
            TableName: !Join [ '_', !GetAZs '' ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'us-east-2a_us-east-2b_us-east-2c' ) // this is where the tests run...
				throw '!GetAZs failed'

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












	it('!GetAZs !Ref AWS::Region', function(done) {

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
            TableName: !Join [ '_', Fn::GetAZs: !Ref AWS::Region ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'us-east-2a_us-east-2b_us-east-2c' ) // this is where the tests run...
				throw '!GetAZs failed'
	
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

	// TableName: !Join [ '_', Fn::GetAZs: !Ref AWS::Region ]

})