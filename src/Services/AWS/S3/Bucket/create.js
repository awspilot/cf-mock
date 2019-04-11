/*
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: PublicRead
      BucketName: public-bucket
      MetricsConfigurations:
        - Id: EntireBucket
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
        RoutingRules:
        - RoutingRuleCondition:
            HttpErrorCodeReturnedEquals: '404'
            KeyPrefixEquals: out1/
          RedirectRule:
            HostName: ec2-11-22-333-44.compute-1.amazonaws.com
            ReplaceKeyPrefixWith: report-404/
    DeletionPolicy: Retain
*/


module.exports = function(DynamoDB, ClientsDynamoDB ,stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	DynamoDB
		.table('cloudformation_resources')
		.insert_or_replace({
			stack_id: stack_id,
			resource_name: res_name,
			type: type,
			properties: properties,
			created_at: new Date().getTime(),
			updated_at: new Date().getTime(),
			phisical_id: properties.BucketName,
			status: 'CREATE_COMPLETE',
		}, cb )
}
