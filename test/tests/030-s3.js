

describe('S3', function () {

	it('CreateStack with AWS::S3::Bucket', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09

Resources:

    MyTable:
        Type: AWS::S3::Bucket
        Properties:
            BucketName: my-bucket
`,
		};
		cloudformation.createStack(params, function(err, data) {
			if (err)
				throw err

			setTimeout(function() {
				done()
			}, 3000)
		});
	})

	// @todo: list tables, check it it is pay per request

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
})
