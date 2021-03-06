



describe('AWS::DynamoDB::Table', function () {

	it('CreateStack', function(done) {

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
Resources:

    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: !Ref TableName
            BillingMode: PAY_PER_REQUEST
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
				throw err


			setTimeout(function() {
				ClientsDynamoDB.client.describeTable({ TableName: 'default_table_name'}, function(err, data ) {
					if (err)
						throw err;
					
					var t = (data.Table || {});
					
					if ( t.BillingModeSummary.BillingMode !== 'PAY_PER_REQUEST' )
						throw 'BillingMode failed'

					// @todo: check KeySchema, LocalSecondaryIndexes and GlobalSecondaryIndexes
					done()
				} )
			}, 1000)
		});
	})

	// @todo: list tables, check it it exists


	it('CreateStack with existing table (should fail)', function(done) {

		var params = {
			StackName: 'stack2',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    TableName:
        Type: String
        Default: default_table_name
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
			
			if (err && (err.code === 'ResourceInUseException')) {
				cloudformation.deleteStack({ StackName: 'stack2', }, function(err, data) {
					done()
				});
				return 
			}

			if (err)
				throw err

			throw 'CreateStack with existing Bucket should have failed'

		});
	})



	




	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			if (err)
				throw err

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
				throw err

			setTimeout(function() {
				var params = {
					StackName: 'STRING_VALUE',
				};
				cloudformation.deleteStack(params, function(err, data) {
					if (err)
						throw err

					done()
				});
			}, 3000)
		});
	})




















	it('BillingMode', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09

Resources:

    MyTable:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: ppr_table
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
				throw err

			// @todo: list tables, check it it is pay per request

			setTimeout(function() {
				var params = {
					StackName: 'STRING_VALUE',
				};
				cloudformation.deleteStack(params, function(err, data) {
					if (err)
						throw err

					done()
				});
			}, 3000)
		});
	})


})
