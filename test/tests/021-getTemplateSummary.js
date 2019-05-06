
describe('all', function () {

	it('getTemplateSummary - multiple refs to pseudo parameters', function(done) {
		var params = {
			TemplateBody: `

AWSTemplateFormatVersion: 2010-09-09
Parameters:
    p1:
        Type: String
        Default: nothing
    p2:
        Type: String
        Default: nothing
    p3:
        Type: String
        Default: nothing
Resources:
    # param1: !Ref ref_in_comment1
    Res1:
        Type: AWS::Mock::Res
        Properties:
          Region1: !Ref AWS::Region
          p1: !Ref p1
          p2: 
            Ref: p2
          # param1 !Ref ref_in_comment2
          nasty_list:
              - !Ref AWS::Region
              - !Ref 
                  AWS::Region
              - !Ref p1
              - !Ref p2
              - !Ref p3
`,
		};
		cloudformation.getTemplateSummary(params, function(err, data) {
			if (err)
				throw err

			done()
		});
	})













	it('getTemplateSummary - !Ref to parameter in comment', function(done) {
		var params = {
			TemplateBody: `

AWSTemplateFormatVersion: 2010-09-09
Resources:
    # param1: !Ref ref_in_comment1
    Res1:
        Type: AWS::Mock::Res
        Properties:
          Region1: !Ref AWS::Region
          # param1 !Ref ref_in_comment2


`,
		};
		cloudformation.getTemplateSummary(params, function(err, data) {
			if (err)
				throw err

			done()
		});
	})






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
