
describe('!Select', function () {
	it('!Select [ idx, [ x, y, z ] ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl_name:
        Type: String
        Default: my_tbl
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Select [ 1, [ !Ref tbl_name, !Ref AWS::StackName ] ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'STRING_VALUE' )
				throw '!Select failed'
	
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


















	it('!Join ["_", [ !Ref tbl_name, !Select [ 1, [ !Ref tbl_name, !Ref AWS::StackName ] ] ] ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl_name:
        Type: String
        Default: my_tbl
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Join [ '_', [ !Ref tbl_name, !Select [ 1, [ !Ref tbl_name, !Ref AWS::StackName ] ] ] ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'my_tbl_STRING_VALUE' )
				throw '!Select failed'
	
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



	it('!Join ["_", [ !Ref tbl_name, !Select [ 1, [ !Ref tbl_name, !Ref AWS::StackName ] ] ] ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl_name:
        Type: String
        Default: this-is-my-table
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName:
                Fn::Select: [ 3, !Split ['-', !Ref tbl_name ] ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'table' )
				throw '!Fn::Select failed'
	
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

