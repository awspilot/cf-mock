



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
			TemplateBody: fs.readFileSync('./test/res/1.yaml','UTF-8'),
		};
		cloudformation.createStack(params, function(err, data) {
			console.log("CreateStack",err,data)
			setTimeout(function() {
				done()
			}, 5000)
		});
	})

	it('ListStacks', function(done) {
		var params = {
		};
		cloudformation.listStacks(params, function(err, data) {
			console.log("ListStacks",err,data)
			done()
		});

	})


	it('DeleteStack', function(done) {
		var params = {
			StackName: 'STRING_VALUE',
		};
		cloudformation.deleteStack(params, function(err, data) {
			console.log("deleteStack",err,data)
			done()
		});
	})




	it('CreateStack(json)', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: fs.readFileSync('./test/res/1.json','UTF-8'),
		};
		cloudformation.createStack(params, function(err, data) {
			console.log("CreateStack",err,data)
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
			console.log("deleteStack",err,data)
			done()
		});
	})










})
