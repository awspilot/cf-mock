



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
	}
}


/*
 @todo:
 AWS::URLSuffix
 AWS::NoValue
 AWS::NotificationARNs
*/
