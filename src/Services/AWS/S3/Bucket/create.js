/*
  S3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      AccessControl: AuthenticatedRead | AwsExecRead | BucketOwnerRead | BucketOwnerFullControl | LogDeliveryWrite | Private | PublicRead | PublicReadWrite
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
*/


var AWS = require('aws-sdk')
var AccessControls = {
	AuthenticatedRead: 'authenticated-read',
	AwsExecRead: undefined,
	BucketOwnerRead: undefined,
	BucketOwnerFullControl: undefined,
	LogDeliveryWrite: undefined,
	Private: 'private',
	PublicRead: 'public-read',
	PublicReadWrite: 'public-read-write',
}

module.exports = function( DynamoDB, region, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )


	var s3  = new AWS.S3({
		endpoint: process.env.S3_ENDPOINT || 'http://localhost/v1/s3/',
		sslEnabled: false,
		s3ForcePathStyle: true,
		region: 'us-east-1',
		credentials: {
			accessKeyId: 'S3RVER',
			secretAccessKey: 'S3RVER',
		}
	})


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
			var payload = { 
				Bucket: properties.BucketName, 
				CreateBucketConfiguration: {
					LocationConstraint: region,
				}
			}

			if ( properties.AccessControl && AccessControls[properties.AccessControl] )
				payload.ACL = AccessControls[properties.AccessControl]

			s3.createBucket(payload, function( err ) {
				if (err)
					return cb({
						errorCode: err.code,
						errorMessage: err.message,
						RawApiPayload: JSON.stringify(payload),
						RawApiError: JSON.stringify(err),
					})

				cb()
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
