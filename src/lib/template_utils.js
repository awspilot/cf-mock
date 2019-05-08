
var find_unresolved_refs_in_obj = function( template_obj, parameters, resources ) {

	if (Array.isArray(template_obj)) {
		var err;
		template_obj.map(function(el) {
			if (!err)
				err = find_unresolved_refs_in_obj(el, parameters, resources )
		});
		return err;
	}
	
	if (typeof template_obj === "object") {
		
		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Ref')) {
			
			if ((parameters.indexOf(template_obj.Ref) === -1) &&  (resources.indexOf(template_obj.Ref) === -1) )
				return { errorCode: 'UNRESOLVED_PARAMETER', errorMessage: 'Unresolved parameter ' + template_obj.Ref }
			
			return;
		}
		
		var err;
		Object.keys(template_obj).map(function(key) {
			if (find_unresolved_refs_in_obj(template_obj[key], parameters, resources ) && !err)
				err = find_unresolved_refs_in_obj(template_obj[key], parameters, resources )

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
				
			return '-UNHANDLED-REF-';
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

		if (
			(Object.keys(template_obj).length === 1) && 
			template_obj.hasOwnProperty('Base64') &&
			(typeof template_obj.Base64 === 'string')
		)
			return Buffer.from(template_obj.Base64).toString('base64');

		if (
			(Object.keys(template_obj).length === 1) && 
			template_obj.hasOwnProperty('Fn::Base64') &&
			(typeof template_obj['Fn::Base64'] === 'string')
		)
			return Buffer.from(template_obj['Fn::Base64']).toString('base64');

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_base64_in_obj(template_obj[key])
		})
	}

	return template_obj;
}

var replace_split_in_obj = function( template_obj ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_split_in_obj(el)
		});
	}

	if (typeof template_obj === "object") {

		if (
			(Object.keys(template_obj).length === 1) && 
			template_obj.hasOwnProperty('Split') &&
			Array.isArray(template_obj.Split) &&
			(typeof template_obj.Split[0] === "string") && 
			(typeof template_obj.Split[1] === "string")
		) {
			return template_obj.Split[1].split(template_obj.Split[0]);
		}

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_split_in_obj(template_obj[key])
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

		if (
			(Object.keys(template_obj).length === 1) &&
			template_obj.hasOwnProperty('Join') &&
			Array.isArray(template_obj.Join) &&
			(typeof template_obj.Join[0] === "string") && 
			Array.isArray( template_obj.Join[1] ) &&
			(template_obj.Join[1].filter(function(val) { return typeof val !== "string" }).length === 0)  // must be array of strings
		)
			return template_obj.Join[1].join(template_obj.Join[0]);

		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_join_in_obj(template_obj[key])
		})
	}

	return template_obj;
}


var replace_select_in_obj = function( template_obj ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_select_in_obj(el)
		});
	}

	if (typeof template_obj === "object") {

		if (
			(Object.keys(template_obj).length === 1) &&
			template_obj.hasOwnProperty('Select') &&
			Array.isArray(template_obj.Select) &&
			((typeof template_obj.Select[0] === "string") || (typeof template_obj.Select[0] === "number")) && 
			Array.isArray( template_obj.Select[1] ) &&
			(template_obj.Select[1].filter(function(val) { return typeof val !== "string" }).length === 0)  // must be array of strings
		)
			return template_obj.Select[1][parseInt(template_obj.Select[0])];


		if (
			(Object.keys(template_obj).length === 1) &&
			template_obj.hasOwnProperty('Fn::Select') &&
			Array.isArray(template_obj['Fn::Select']) &&
			((typeof template_obj['Fn::Select'][0] === "string") || (typeof template_obj['Fn::Select'][0] === "number")) && 
			Array.isArray( template_obj['Fn::Select'][1] ) &&
			(template_obj['Fn::Select'][1].filter(function(val) { return typeof val !== "string" }).length === 0)  // must be array of strings
		)
			return template_obj['Fn::Select'][1][parseInt(template_obj['Fn::Select'][0])];



		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_select_in_obj(template_obj[key])
		})
	}

	return template_obj;
}



var replace_findinmap_in_obj = function( template_obj, maps ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_findinmap_in_obj( el, maps )
		});
	}

	if (typeof template_obj === "object") {

		if (
			(Object.keys(template_obj).length === 1) &&
			template_obj.hasOwnProperty('FindInMap') &&
			Array.isArray(template_obj.FindInMap) &&
			(template_obj.FindInMap.filter(function(val) { return (typeof val !== "string") && (typeof val !== "number") }).length === 0)  // must be array of strings
		) {
			// depends on length
			if (template_obj.FindInMap.length === 2)
				return ((maps || {})[template_obj.FindInMap[0]] || {})[template_obj.FindInMap[1]] || 'undefined';

			if (template_obj.FindInMap.length === 3)
				return (((maps || {})[template_obj.FindInMap[0]] || {})[template_obj.FindInMap[1]] || {})[template_obj.FindInMap[2]] || 'undefined';


			return 'undefined';
		}

		if (
			(Object.keys(template_obj).length === 1) &&
			template_obj.hasOwnProperty('Fn::FindInMap') &&
			Array.isArray(template_obj['Fn::FindInMap']) &&
			(template_obj['Fn::FindInMap'].filter(function(val) { return (typeof val !== "string") && (typeof val !== "number") }).length === 0)  // must be array of strings
		) {
			// depends on length
			if (template_obj['Fn::FindInMap'].length === 2)
				return ((maps || {})[template_obj['Fn::FindInMap'][0]] || {})[template_obj['Fn::FindInMap'][1]] || 'undefined';

			if (template_obj['Fn::FindInMap'].length === 3)
				return (((maps || {})[template_obj['Fn::FindInMap'][0]] || {})[template_obj['Fn::FindInMap'][1]] || {})[template_obj['Fn::FindInMap'][2]] || 'undefined';


			return 'undefined';
		}



		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_findinmap_in_obj(template_obj[key], maps )
		})
	}

	return template_obj;
}

var replace_sub_in_obj = function( template_obj, pseudo_parameters, parameters ) {



	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_sub_in_obj(el, pseudo_parameters, parameters )
		});
	}

	if (typeof template_obj === "object") {

		if ((Object.keys(template_obj).length === 1) && template_obj.hasOwnProperty('Sub')) {


			if (typeof template_obj.Sub === "string" ) {
				var substring = template_obj.Sub;

				Object.keys(pseudo_parameters).map(function(key) {
					// @todo: check if space is allowed ${ space varname space } - then we need regex or eval with javascript templates
					substring = substring.split('${' + key + '}').join(pseudo_parameters[key])
				})

				Object.keys(parameters).map(function(key) {
					// @todo: check if space is allowed ${ space varname space } - then we need regex or eval with javascript templates
					substring = substring.split('${' + key + '}').join(parameters[key])
				})

				return substring;
			}

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
			template_obj[key] = replace_sub_in_obj(template_obj[key], pseudo_parameters, parameters )
		})
	}

	return template_obj;
}


var replace_getazs_in_obj = function( template_obj, region ) {

	if (Array.isArray(template_obj)) {
		return template_obj.map(function(el) {
			return replace_getazs_in_obj(el, region)
		});
	}
	
	if (typeof template_obj === "object") {
	
		if (
			(Object.keys(template_obj).length === 1) && 
			template_obj.hasOwnProperty('GetAZs') &&
			(typeof template_obj.GetAZs === "string")
		) {
			if (template_obj.GetAZs === "")
				return [ region + 'a', region + 'b', region + 'c' ];
			
			return [ template_obj.GetAZs + 'a', template_obj.GetAZs + 'b', template_obj.GetAZs + 'c' ];

		}

		if (
			(Object.keys(template_obj).length === 1) && 
			template_obj.hasOwnProperty('Fn::GetAZs') &&
			(typeof template_obj['Fn::GetAZs'] === "string")
		) {
			
			return [ template_obj['Fn::GetAZs'] + 'a', template_obj['Fn::GetAZs'] + 'b', template_obj['Fn::GetAZs'] + 'c' ];

		}


		Object.keys(template_obj).map(function(key) {
			template_obj[key] = replace_getazs_in_obj(template_obj[key], region )
		})
	}

	return template_obj;
}


module.exports = {

	find_unresolved_refs_in_obj: find_unresolved_refs_in_obj,
	replace_pseudo_parameters_in_obj: replace_pseudo_parameters_in_obj,
	replace_parameters_in_obj: replace_parameters_in_obj,
	replace_base64_in_obj: replace_base64_in_obj,
	replace_join_in_obj: replace_join_in_obj,
	replace_select_in_obj: replace_select_in_obj,
	replace_findinmap_in_obj: replace_findinmap_in_obj,
	replace_split_in_obj: replace_split_in_obj,
	replace_sub_in_obj: replace_sub_in_obj,
	replace_getazs_in_obj: replace_getazs_in_obj,

	// remove_comments: function(TemplateBody) {
	// 	return TemplateBody
	// 		.split("\n")
	// 		.map(function(line) {
	// 			return line.replace(/^\s*#(.*)$/gm, "")
	// 		})
	// 		.join("\n");
	// }
}
