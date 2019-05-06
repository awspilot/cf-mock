describe('ListStackResources', function () {
	it('CreateStack', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Resources:

    MyResource:
        Type: Hello:World
        Properties:
            region1: !Ref "AWS::Region"
            region2: !Ref AWS::Region

            account1: !Ref "AWS::AccountId"
            account2: !Ref AWS::AccountId

            partition1: !Ref "AWS::Partition"
            partition2: !Ref AWS::Partition

            stackname1: !Ref "AWS::StackName"
            stackname2: !Ref AWS::StackName

            stackid1: !Ref "AWS::StackId"
            stackid2: !Ref AWS::StackId

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

	it('ListStackResources', function(done) {
		cloudformation.listStackResources({ StackName: 'STRING_VALUE', }, function(err, data) {

			if (err)
				throw err;
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
