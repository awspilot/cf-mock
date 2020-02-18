# cf-mock

[![Build Status](https://travis-ci.org/awspilot/cf-mock.svg?branch=master)](https://travis-ci.org/awspilot/cf-mock)

Not much value in here, just a subproject of @awspilot/dynamodb-ui

It's main purpose is to expose a minimal api that mimic the AWS Cloudformation functionality

Why ? Manage tables inside dynamodb-local using cloudformation templates


cf-mock uses dynamodb as storage

```
	npm install @awspilot/cf-mock
```

```
	export CF_DYNAMODB_ENDPOINT="http://localhost:8000/us-east-1"
	export CF_DYNAMODB_KEY="myKeyId"
	export CF_DYNAMODB_SECRET="secretKey"
	# CF_DYNAMODB_REGION - will be taken from "new AWS.Cloudformation()" endpoint's path

	export DYNAMODB_ENDPOINT="http://localhost:8000"
	export DYNAMODB_KEY="myKeyId"
	export DYNAMODB_SECRET="secretKey"
	# DYNAMODB_REGION - will be taken from "new AWS.Cloudformation()" endpoint's path

 	cf-mock &
```

```
	const AWS = require('aws-sdk')
	var cloudformation = new AWS.CloudFormation({
		endpoint: 'http://localhost:10001/us-east-1',

		// region is required by aws-sdk to build the endpoint host when endpoint is not passwd
		// we passed an endpoint so it does not really matter what we write in region
		region: 'xyz',

		accessKeyId: "myKeyId",
		secretAccessKey: "secretKey",
	});

```
