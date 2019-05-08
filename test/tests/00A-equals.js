
describe('!Equals', function () {
	it('!Equals - not actually working just testing if it crash', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: `

AWSTemplateFormatVersion: 2010-09-09

Parameters: 
    EnvType: 
        Description: Environment type.
        Default: test
        Type: String
        AllowedValues: 
          - prod
          - test

Conditions: 
    Cond1: !Equals [ !Ref EnvType, prod ]
    Cond2: !Not    [ !Equals [!Ref EnvType, prod]]
    Cond3: !Or     [ !Equals [ EnvType, prod ], Condition: Cond2 ]
    Cond4: !And    [ !Equals [ EnvType, prod ], Condition: SomeOtherCondition ]
Resources:
    MyTable:
        Type: AWS::Decoy
        Condition: CreateProdResources1
        Properties:
            Hello: World
            Size: !If [Cond1, 100, 10]
            MyCidr: !Cidr [ ipBlock, count, cidrBits ]
            ForeignValue: !ImportValue sharedValueToImport
            Translate: !Transform { "Name" : macro name, "Parameters" : {key : value } }
            LocalAtt: !GetAtt logicalNameOfResource.attributeName
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
	// it('ListStackResources', function(done) {
	// 	cloudformation.listStackResources({ StackName: 'STRING_VALUE', }, function(err, data) {
	// 
	// 		if (err)
	// 			throw err;
	// 
	// 		if ( data.StackResourceSummaries[0].PhysicalResourceId !== 'STRING_VALUE' )
	// 			throw '!Select failed'
	// 
	// 		done()
	// 	});
	// })
	it('DeleteStack', function(done) {
		cloudformation.deleteStack({ StackName: 'STRING_VALUE', }, function(err, data) {
			if (err)
				throw err;
	
			done()
		});
	})















})

