
describe('all', function () {

	it('getTemplateSummary - !Ref to unknown parameter', function(done) {
		var params = {
			TemplateBody: `

AWSTemplateFormatVersion: 2010-09-09
Parameters:
    p1:
        Type: String
Resources:

    Res1:
        Type: AWS::Mock::Res
        Properties:
          Region1: !Ref AWS::Region
          Ref1: !Ref p1

    Res2:
        Type: AWS::Mock::Res
        Properties:
          Region2: !Ref "AWS::Region"
          Ref2: !Ref Res1
    Res3:
        Type: AWS::Mock::Res
        Properties:
          Ref3: !Ref SomeParameter
`,
		};
		cloudformation.getTemplateSummary(params, function(err, data) {
			if (err && err.code === 'UNRESOLVED_PARAMETER')
				return done()

			if (err)
				throw err;

			throw 'supposed to fail';
		});
	})


})
