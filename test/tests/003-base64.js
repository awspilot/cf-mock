describe('!Base64', function () {
	it('!Base64 string', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Base64 mytable12
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

			if (data.StackResourceSummaries[0].PhysicalResourceId !== Buffer.from('mytable12').toString('base64'))
				throw 'base64 failed';

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





	it('Fn::Base64: !Base64 string', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Resources:
    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: 
                Fn::Base64: !Base64 mytable
                # Fn::Base64: !Sub |
                #       multi
                #       line
                #       string
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
	
			if (data.StackResourceSummaries[0].PhysicalResourceId !==  Buffer.from(Buffer.from('mytable').toString('base64')).toString('base64')   )
				throw 'base64 failed';
	
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