require("../src/index")
require('./lib/index.js')


require('./tests/000-index.js')

require('./tests/001-ref.js')

require('./tests/002-describestacks.js')
require('./tests/002-getTemplateSummary.js')
require('./tests/003-pseudoparameters.js')
require('./tests/004-liststackresources.js')

require('./tests/200-dynamodb.js')
require('./tests/300-s3.js')


