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


var AWS = require('aws-sdk')
var s3  = new AWS.S3({
	endpoint: 'http://localhost/v1/s3/',
	sslEnabled: false,
	s3ForcePathStyle: true,
	region: 'us-east-1',
	credentials: {
		accessKeyId: 'S3RVER',
		secretAccessKey: 'S3RVER',
	}
})

module.exports = function(DynamoDB, ClientsDynamoDB ,stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	async.waterfall([

		function( cb ) {
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
					status: 'CREATE_IN_PROGRESS',
				}, function(err) {
					cb(err)
				} )

		},

		// create the bucket
		function( cb ) {
			s3.createBucket({ Bucket: properties.BucketName, }, function( err ) {
				cb( err )
			})
		},

		function( cb ) {
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
				}, function(err) {
					cb(err)
				} )
		},
	], function(err) {
		cb(err)
	})



}