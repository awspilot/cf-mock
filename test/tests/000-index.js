



describe('init', function () {
	it('waiting for cf to start', function(done) {
		setTimeout(function() {
			done()
		},9000)
	})
	it('CreateStack(yml)', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			Parameters: [
				{
					ParameterKey: 'OrgDomain',
					ParameterValue: 'testdomain.com',
				},
			],
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    OrgName:
        Type: String
        Default: My Organisation
    OrgDomain:
        Type: String
Resources:

    DbAlbums:
        Type: AWS::DynamoDB::Table
        Properties:
            TableName: albums
            AttributeDefinitions:
                -
                  AttributeName: user_id
                  AttributeType: S

                - AttributeName: album_id
                  AttributeType: S

            KeySchema:
                -
                  AttributeName: user_id
                  KeyType: HASH
                -
                  AttributeName: album_id
                  KeyType: RANGE
            ProvisionedThroughput:
                ReadCapacityUnits: 1
                WriteCapacityUnits: 1
`,
		};
		cloudformation.createStack(params, function(err, data) {
			if (err)
				throw err;

			setTimeout(function() {
				done()
			}, 5000)
		});
	})

	it('ListStacks', function(done) {
		var params = {
		};
		cloudformation.listStacks(params, function(err, data) {
			if (err)
				throw err;

			done()
		});

	})


	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			if (err)
				throw err;

			done()
		});
	})




	it('CreateStack(json)', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Resources": {
	    "DbAlbums": {
	        "Type": "AWS::DynamoDB::Table",
	        "Properties": {
	            "TableName": "albums",
	            "AttributeDefinitions": [
	                {
	                  "AttributeName": "user_id",
	                  "AttributeType": "S"
	                },{
	                  "AttributeName": "album_id",
	                  "AttributeType": "S"
					}
				],
	            "KeySchema": [
	                {
	                  "AttributeName": "user_id",
	                  "KeyType": "HASH"
	                },{
	                  "AttributeName": "album_id",
	                  "KeyType": "RANGE"
					}
				],
	            "ProvisionedThroughput": {
	                "ReadCapacityUnits": 1,
	                "WriteCapacityUnits": 1
				}
			}
		}
	}
}
`,
		};
		cloudformation.createStack(params, function(err, data) {
			if (err)
				throw err;

			setTimeout(function() {
				done()
			}, 5000)
		});
	})
	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			if (err)
				throw err;

			done()
		});
	})










})
