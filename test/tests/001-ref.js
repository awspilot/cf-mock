describe('!Ref to parameter', function () {
	it('CreateStack', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `
AWSTemplateFormatVersion: 2010-09-09
Parameters:
    ReadCapacity:
        Type: String
        Default: 202
    WriteCapacity:
        Type: String
        Default: 101
    NewVolume:
        Type: String
        Default: my-volume
Resources:

    DbUsers:
        Type: Hello:World
        Properties:
            Test1: !Ref "AWS::EC2::Subnet"
            Test2: !Ref "AWS::AccountId"
            Test3: !Ref AWS::EC2::Subnet
            Test4: !Ref AWS::AccountId
            Test5: !GetAtt myELB.DNSName
            Test6: !Base64 xyz
            Test7: !FindInMap xyz
            Test8: !GetAZs xyz
            Test9: !If xyz
            Test10: !Join xyz
            Test11: !Select xyz
            Test12: !Sub zyz
            VolumeId:
                !Ref NewVolume
            ProvisionedThroughput:
                ReadCapacityUnits: !Ref "ReadCapacity"
                WriteCapacityUnits: !Ref WriteCapacity
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
		cloudformation.deleteStack({ StackName: 'STRING_VALUE', }, function(err, data) {
			if (err)
				throw err;
			done()
		});
	})


})
