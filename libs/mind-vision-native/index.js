// Native addon loader for mind-vision
try {
	module.exports = require('./build/Release/mind-vision-native.node');
} catch (err) {
	console.error('Failed to load mind-vision-native addon:', err.message);
	console.error('Make sure to run "npm install" in the mind-vision-native directory to compile the addon');
	throw err;
}
