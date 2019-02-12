describe('!Ref to parameter', function () {
	it('CreateStack', function(done) {

		var params = {
			StackName: 'STRING_VALUE',
			TemplateBody: fs.readFileSync('./test/res/2-ref.yaml','UTF-8'),
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
