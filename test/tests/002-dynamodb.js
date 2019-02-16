



describe('dynamodb', function () {

	it('!Ref TableName (no parameter value)', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			// Parameters: [
			// 	{
			// 		ParameterKey: 'TableName',
			// 		ParameterValue: 'my_table',
			// 	},
			// ],
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    TableName:
        Type: String
        Default: default_table_name
    OrgDomain:
        Type: String
Resources:

    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Ref TableName
            AttributeDefinitions:
                -
                  AttributeName: field
                  AttributeType: S

            KeySchema:
                -
                  AttributeName: field
                  KeyType: HASH

            ProvisionedThroughput:
                ReadCapacityUnits: 1
                WriteCapacityUnits: 1
`,
		};
		cloudformation.createStack(params, function(err, data) {
			if (err)
				throw err()

			setTimeout(function() {
				done()
			}, 3000)
		});
	})

	// @todo: list tables, check it it exists

	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			if (err)
				throw err()

			done()
		});
	})














	it('!Ref TableName', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			Parameters: [
				{
					ParameterKey: 'TableName',
					ParameterValue: 'my_table',
				},
			],
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    TableName:
        Type: String
        Default: default_table_name
    OrgDomain:
        Type: String
Resources:

    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Ref TableName
            AttributeDefinitions:
                -
                  AttributeName: field
                  AttributeType: S

            KeySchema:
                -
                  AttributeName: field
                  KeyType: HASH

            ProvisionedThroughput:
                ReadCapacityUnits: 1
                WriteCapacityUnits: 1
`,
		};
		cloudformation.createStack(params, function(err, data) {
			if (err)
				throw err()

			setTimeout(function() {
				done()
			}, 3000)
		});
	})

	// @todo: list tables, check it it exists

	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			if (err)
				throw err()

			done()
		});
	})

})
