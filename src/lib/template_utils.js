



module.exports = {
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

		}

		return TemplateBody
	}
}


/*
AWS::URLSuffix
AWS::StackName
AWS::StackId: arn:aws:cloudformation:us-west-2:123456789012:stack/teststack/51af3dc0-da77-11e4-872e-1234567db123
AWS::NoValue
AWS::NotificationARNs

*/
