



module.exports = {
	replace_parameters: function( TemplateBody, params ) {

		// !Ref XXX
		var re = /\!Ref\s+([a-zA-Z0-9]+)/g

		TemplateBody = TemplateBody.split("\n")
		TemplateBody = TemplateBody.map(function(tb) {

			var findings;
			do {
				findings = []
				var refs = null
				while ( refs = re.exec(tb)) {
					findings.push(refs)
				}
				findings = Array.from(new Set(findings)) // uniq
				findings = findings.sort(function(a,b) { return a[0].length > b[0].length ? -1 : 1 })
				if (findings.length) {
					tb = tb.split(findings[0][0]).join( params[ findings[0][1] ] || "undefined" )
				}
			} while ( findings.length);



			return tb;
		})
		return TemplateBody.join("\n")
	},

	replace_pseudo_parameters: function( TemplateBody, params ) {
		var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {

			if (refs[1] + '::' + refs[2] === 'AWS::Region')
				TemplateBody = TemplateBody.split(refs[0]).join( params.region )

			if (refs[1] + '::' + refs[2] === 'AWS::AccountId')
				TemplateBody = TemplateBody.split(refs[0]).join( params.account_id )

			if (refs[1] + '::' + refs[2] === 'AWS::Partition')
				TemplateBody = TemplateBody.split(refs[0]).join( 'aws' )

			if (refs[1] + '::' + refs[2] === 'AWS::StackName')
				TemplateBody = TemplateBody.split(refs[0]).join( params.stack_name )

			if (refs[1] + '::' + refs[2] === 'AWS::StackId')
				TemplateBody = TemplateBody.split(refs[0]).join( params.stack_id )


		}

		var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {

			if (refs[1] + '::' + refs[2] === 'AWS::Region')
				TemplateBody = TemplateBody.split(refs[0]).join( params.region )

			if (refs[1] + '::' + refs[2] === 'AWS::AccountId')
				TemplateBody = TemplateBody.split(refs[0]).join( params.account_id )

			if (refs[1] + '::' + refs[2] === 'AWS::Partition')
				TemplateBody = TemplateBody.split(refs[0]).join( 'aws' )

			if (refs[1] + '::' + refs[2] === 'AWS::StackName')
				TemplateBody = TemplateBody.split(refs[0]).join( params.stack_name )

			if (refs[1] + '::' + refs[2] === 'AWS::StackId')
				TemplateBody = TemplateBody.split(refs[0]).join( params.stack_id )

		}


		var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {
			TemplateBody = TemplateBody.split(refs[0]).join( 'unhandled' )
		}
		var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {
			TemplateBody = TemplateBody.split(refs[0]).join( 'unhandled' )
		}

		return TemplateBody
	},
	cleanup_cloudformation_specific: function( TemplateBody ) {

		// !Sub \n ( with parameters on the next line )
		var re = /\!Sub\s?$/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {
			TemplateBody = TemplateBody.split(refs[0]).join('')
		}


		TemplateBody = TemplateBody
			.split('!Ref').join('')
			.split('!GetAtt').join('')
			.split('!Base64').join( ''  )
			.split('!FindInMap').join( ''  )
			.split('!GetAZs').join( ''  )
			.split('!If').join( ''  )
			.split('!Join').join( ''  )
			.split('!Select').join( ''  )
			.split('!Split').join( ''  )
			.split('!Sub').join( ''  )

			.split('!And').join( ''  )
			.split('!Equals').join( ''  )
			.split('!Not').join( ''  )
			.split('!Or').join( ''  )

			.split('!Cidr').join( ''  )
			.split('!ImportValue').join( ''  )
			.split('!Transform').join( ''  )
			;

		return TemplateBody;
	}
}


/*
 @todo:
 AWS::URLSuffix
 AWS::NoValue
 AWS::NotificationARNs
*/
