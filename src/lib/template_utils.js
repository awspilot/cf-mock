



module.exports = {
	replace_pseudo_parameter_region: function( TemplateBody, region ) {
		var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {
			TemplateBody = TemplateBody.split(refs[0]).join( region )
		}

		var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
		var refs = null
		while ( refs = re.exec(TemplateBody)) {
			TemplateBody = TemplateBody.split(refs[0]).join( region )
		}

		return TemplateBody
	}
}
