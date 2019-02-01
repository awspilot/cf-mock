

require("../src/index")
console.log("init test")

setTimeout(function() {
	process.exit()
	console.log("done..")
},10000)
