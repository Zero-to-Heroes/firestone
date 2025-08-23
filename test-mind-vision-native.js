// Test script for the mind-vision-native addon
console.log('🧪 Testing Mind Vision Native Addon...\n');

try {
	// Load the native addon
	const mindVision = require('./libs/mind-vision-native');

	console.log('✅ Addon loaded successfully!');

	// Test the basic test function
	console.log('🔧 Testing basic functionality...');
	const testResult = mindVision.test();
	console.log('📝 Test result:', testResult);

	// Check if DLL is initialized
	console.log('🔍 Checking DLL initialization...');
	const isInitialized = mindVision.isInitialized();
	console.log('📊 Is initialized:', isInitialized);

	// Try to get current scene (this will attempt to load the DLL)
	console.log('🎮 Attempting to get current scene...');
	try {
		const scene = mindVision.getCurrentScene();
		console.log('🎯 Current scene:', scene);
		console.log('✅ SUCCESS: Mind Vision DLL is working!');
	} catch (error) {
		console.log('⚠️  DLL Error:', error.message);
		console.log('💡 This is expected if Hearthstone is not running or DLL path is incorrect');
	}
} catch (error) {
	console.error('❌ Failed to load addon:', error.message);
	console.error('💡 Make sure the addon was compiled successfully');
}

console.log('\n🏁 Test completed!');
