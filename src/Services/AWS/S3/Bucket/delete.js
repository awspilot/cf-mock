var AWS = require('aws-sdk')
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

module.exports = function(DynamoDB, ClientsDynamoDB, stack_id, res_name, type, properties, cb ) {
	//console.log( res_name )

	async.waterfall([

		// delete the bucket
		function( cb ) {

			s3.deleteBucket({ Bucket: properties.BucketName }, function(err, data) {
				if (err && err.code === 'NoSuchBucket')
					return cb()

				cb(err)
			});

		},


		// delete the resource from db
		function( cb ) {
			DynamoDB
				.table('cloudformation_resources')
				.where('stack_id').eq(stack_id)
				.where('resource_name').eq(res_name)
				.delete( function(err) {
					cb(err)
				} )
		},
	], function(err) {
		// if err, mark resource as failed delete

		cb(err)
	})

}

