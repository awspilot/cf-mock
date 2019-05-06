
var find_unresolved_refs_in_obj = function( template_obj, parameters ) {

	if (Array.isArray(template_obj)) {
		var err;
		template_obj.map(function(el) {
			if (!err) 
				err = find_unresolved_refs_in_obj(el, parameters)
		});
		return err;
	}
	
	if (typeof template_obj === "object") {
		
		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Ref')) {
			
			if (parameters.indexOf(template_obj.Ref) === -1)
				return { errorCode: 'UNRESOLVED_PARAMETER', errorMessage: 'Unresolved parameter ' + template_obj.Ref }
			
			return;
		}
		
		var err;
		Object.keys(template_obj).map(function(key) {
			if (find_unresolved_refs_in_obj(template_obj[key], parameters ) && !err)
				err = find_unresolved_refs_in_obj(template_obj[key], parameters)

		})
		return err;
	}
}

var replace_pseudo_parameters_in_obj = function( template_obj, parameters ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_pseudo_parameters_in_obj(el, parameters)
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Ref')) {
			if (template_obj.Ref === "AWS::Region")
				return parameters['region'];

			if (template_obj.Ref === "AWS::Partition")
				return 'aws-local';

			if (template_obj.Ref === "AWS::StackId")
				return parameters['stack_id'];

			if (template_obj.Ref === "AWS::StackName")
				return parameters['stack_name'];

			if (template_obj.Ref === "AWS::AccountId")
				return parameters['account_id'];

			if (template_obj.Ref === "AWS::NoValue")
				return undefined;

			if (template_obj.Ref === "AWS::NotificationARNs")
				return undefined;

			if (template_obj.Ref === "AWS::URLSuffix")
				return undefined;

			return template_obj; // dont touch, dont know what this is...
		}
		
		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_pseudo_parameters_in_obj(template_obj[key], parameters)
		})
	}

	return template_obj;
}

var replace_parameters_in_obj = function( template_obj, parameters ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_parameters_in_obj(el, parameters)
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Ref')) {

			if (parameters.hasOwnProperty( template_obj.Ref ) )
				return parameters[template_obj.Ref]
				
			return '==UNHANDLED==';
		}
		
		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_parameters_in_obj(template_obj[key], parameters)
		})
	}

	return template_obj;
}

var replace_base64_in_obj = function( template_obj ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_base64_in_obj(el)
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Base64'))
			return Buffer.from(template_obj.Base64).toString('base64');

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_base64_in_obj(template_obj[key])
		})
	}

	return template_obj;
}


var replace_join_in_obj = function( template_obj ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_join_in_obj(el)
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Join'))
			return template_obj.Join[1].join(template_obj.Join[0]);

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_join_in_obj(template_obj[key])
		})
	}

	return template_obj;
}

var replace_sub_in_obj = function( template_obj, pseudo_parameters ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_sub_in_obj(el,pseudo_parameters)
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Sub')) {
			
			var substring = template_obj.Sub[0];
			var sub_obj = template_obj.Sub[1]
			
			Object.keys(pseudo_parameters).map(function(key) {
				// @todo: check if space is allowed ${ space varname space } - then we need regex or eval with javascript templates
				substring = substring.split('${' + key + '}').join(pseudo_parameters[key])
			})

			Object.keys(sub_obj).map(function(key) {
				// @todo: check if space is allowed ${ space varname space } - then we need regex or eval with javascript templates
				substring = substring.split('${' + key + '}').join(sub_obj[key])
			})

			return substring;
		}

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_sub_in_obj(template_obj[key], pseudo_parameters)
		})
	}

	return template_obj;
}

module.exports = {
	// replace_parameters: function( TemplateBody, params ) {
	// 
	// 	// !Ref XXX
	// 	var re = /\!Ref\s+([a-zA-Z0-9]+)/g
	// 
	// 	TemplateBody = TemplateBody.split("\n")
	// 	TemplateBody = TemplateBody.map(function(tb) {
	// 
	// 		var findings;
	// 		do {
	// 			findings = []
	// 			var refs = null
	// 			while ( refs = re.exec(tb)) {
	// 				findings.push(refs)
	// 			}
	// 			findings = Array.from(new Set(findings)) // uniq
	// 			findings = findings.sort(function(a,b) { return a[0].length > b[0].length ? -1 : 1 })
	// 			if (findings.length) {
	// 				tb = tb.split(findings[0][0]).join( params[ findings[0][1] ] || "undefined" )
	// 			}
	// 		} while ( findings.length);
	// 
	// 
	// 
	// 		return tb;
	// 	})
	// 	return TemplateBody.join("\n")
	// },

	// replace_pseudo_parameters: function( TemplateBody, params ) {
	// 	var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
	// 	var refs = null
	// 	while ( refs = re.exec(TemplateBody)) {
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::Region')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.region )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::AccountId')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.account_id )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::Partition')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( 'aws' )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::StackName')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.stack_name )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::StackId')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.stack_id )
	// 
	// 
	// 	}
	// 
	// 	var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
	// 	var refs = null
	// 	while ( refs = re.exec(TemplateBody)) {
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::Region')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.region )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::AccountId')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.account_id )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::Partition')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( 'aws' )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::StackName')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.stack_name )
	// 
	// 		if (refs[1] + '::' + refs[2] === 'AWS::StackId')
	// 			TemplateBody = TemplateBody.split(refs[0]).join( params.stack_id )
	// 
	// 	}
	// 
	// 
	// 	var re = /\!Ref\s+\"([A-Za-z0-9]+)::([A-Za-z0-9]+)\"/gm
	// 	var refs = null
	// 	while ( refs = re.exec(TemplateBody)) {
	// 		TemplateBody = TemplateBody.split(refs[0]).join( 'unhandled' )
	// 	}
	// 	var re = /\!Ref\s+([A-Za-z0-9]+)::([A-Za-z0-9]+)\s?$/gm
	// 	var refs = null
	// 	while ( refs = re.exec(TemplateBody)) {
	// 		TemplateBody = TemplateBody.split(refs[0]).join( 'unhandled' )
	// 	}
	// 
	// 	return TemplateBody
	// },
	// cleanup_cloudformation_specific: function( TemplateBody ) {
	// 
	// 	// !Sub \n ( with parameters on the next line )
	// 	var re = /\!Sub\s?$/gm
	// 	var refs = null
	// 	while ( refs = re.exec(TemplateBody)) {
	// 		TemplateBody = TemplateBody.split(refs[0]).join('')
	// 	}
	// 
	// 
	// 	TemplateBody = TemplateBody
	// 		.split('!Ref').join('')
	// 		.split('!GetAtt').join('')
	// 		.split('!Base64').join( ''  )
	// 		.split('!FindInMap').join( ''  )
	// 		.split('!GetAZs').join( ''  )
	// 		.split('!If').join( ''  )
	// 		.split('!Join').join( ''  )
	// 		.split('!Select').join( ''  )
	// 		.split('!Split').join( ''  )
	// 		.split('!Sub').join( ''  )
	// 
	// 		.split('!And').join( ''  )
	// 		.split('!Equals').join( ''  )
	// 		.split('!Not').join( ''  )
	// 		.split('!Or').join( ''  )
	// 
	// 		.split('!Cidr').join( ''  )
	// 		.split('!ImportValue').join( ''  )
	// 		.split('!Transform').join( ''  )
	// 		;
	// 
	// 	return TemplateBody;
	// },

	find_unresolved_refs_in_obj: find_unresolved_refs_in_obj,
	replace_pseudo_parameters_in_obj: replace_pseudo_parameters_in_obj,
	replace_parameters_in_obj: replace_parameters_in_obj,
	replace_base64_in_obj: replace_base64_in_obj,
	replace_join_in_obj: replace_join_in_obj,
	replace_sub_in_obj: replace_sub_in_obj,
	
	// find_unresolved_refs: function(TemplateBody, resolved_refs ) {
	// 
	// 	var err = false;
	// 	var lines = TemplateBody.split("\n").forEach(function(line, line_number ) {
	// 		if (err)
	// 			return;
	// 
	// 		var re = /\!Ref\s+\"([^\"]*)\"/gm;
	// 		var refs = null
	// 		while ( refs = re.exec(line)) {
	// 			if (resolved_refs.indexOf(refs[1]) === -1 )
	// 				err = {errorCode: 'UNRESOLVED_PARAMETER', errorMessage: 'Unresolved parameter ' + refs[1] + ' at line ' + line_number }
	// 		}
	// 
	// 		var re = /\!Ref\s+([a-zA-Z0-9]+)/g
	// 		var refs = null
	// 		while ( refs = re.exec(line)) {
	// 			if (resolved_refs.indexOf(refs[1]) === -1 )
	// 				err = {errorCode: 'UNRESOLVED_PARAMETER', errorMessage: 'Unresolved parameter ' + refs[1] + ' at line ' + line_number }
	// 		}
	// 
	// 
	// 	})
	// 	return err;
	// },
	
	// remove_comments: function(TemplateBody) {
	// 	return TemplateBody
	// 		.split("\n")
	// 		.map(function(line) {
	// 			return line.replace(/^\s*#(.*)$/gm, "")
	// 		})
	// 		.join("\n");
	// }
}

