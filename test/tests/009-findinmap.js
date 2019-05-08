
describe('!FindInMap', function () {
	it('!FindInMap [ x, y, z ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    key_name:
        Type: String
        Default: ID
Mappings:
  RegionMap:
    us-east-1:
      ID: ZXCVBN
    us-east-2:
      ID: QWERTY

Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !FindInMap [ 'RegionMap', !Ref AWS::Region, !Ref key_name ]
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
	
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'QWERTY' )
				throw '!FindInMap failed'
	
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









	it('!Join ["_", [ !Ref tbl_prefix, !FindInMap [ RegionMap, !Ref AWS::Region, !Ref key_name ] ] ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl_prefix:
        Type: String
        Default: tbl
    key_name:
        Type: String
        Default: ID
Mappings:
  RegionMap:
    us-east-1:
      ID: ZXCVBN
    us-east-2:
      ID: QWERTY
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Join [ '_', [ !Ref tbl_prefix, !FindInMap [ RegionMap, !Ref AWS::Region, !Ref key_name ] ] ]
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

			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'tbl_QWERTY' )
				throw '!FindInMap failed'

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









	it('!Join ["_", [ !Ref tbl_name, !FindInMap [ 1, [ !Ref tbl_name, !Ref AWS::StackName ] ] ] ]', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    tbl:
        Type: String
        Default: RegionMap|us-east-1|ID

Mappings:
  RegionMap:
    us-east-1:
      ID: ZXCVBN
    us-east-2:
      ID: QWERTY
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName:
                Fn::FindInMap: !Split [ '|', !Ref tbl ]
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
			
			if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'ZXCVBN' )
				throw '!Fn::FindInMap failed'

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