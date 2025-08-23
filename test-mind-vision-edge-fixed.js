// Test script for the fixed mind-vision-edge integration
console.log('🧪 Testing Fixed Mind Vision Edge.js Integration...\n');

async function testMindVisionEdgeFixed() {
	try {
		// Load the simple edge wrapper
		const MindVisionEdgeSimple = require('./libs/mind-vision-edge/index-simple');
		const mindVision = new MindVisionEdgeSimple();

		console.log('✅ Edge.js wrapper loaded successfully!');

		// Test initialization
		console.log('🔧 Initializing MindVision plugin...');
		const initResult = await mindVision.initialize();

		if (initResult) {
			console.log('✅ Plugin initialized successfully!');

			// Test isInitialized
			console.log('🔍 Checking initialization status...');
			const isInit = await mindVision.isInitialized();
			console.log('📊 Is initialized:', isInit);

			// Test the FIXED getCurrentScene with proper callback handling
			console.log('🎮 Testing FIXED getCurrentScene with callback...');
			try {
				// Set a timeout for the entire operation
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Operation timed out after 5 seconds')), 5000);
				});

				const scenePromise = mindVision.getCurrentScene();
				const scene = await Promise.race([scenePromise, timeoutPromise]);

				console.log('🎯 Current scene (with callback):', scene);
				console.log('✅ SUCCESS: getCurrentScene with callback worked!');
			} catch (error) {
				console.log('⚠️  Scene Error:', error.message);

				if (error.message.includes('timed out')) {
					console.log('💡 Still hanging - callback mechanism needs more work');
				}
			}

			// Also test the sync version for comparison
			console.log('🎮 Testing sync getCurrentScene for comparison...');
			try {
				const syncResult = await mindVision.getCurrentSceneSync();
				console.log('🎯 Sync scene result:', syncResult);
			} catch (error) {
				console.log('⚠️  Sync scene error:', error.message);
			}
		} else {
			console.log('❌ Failed to initialize plugin');
		}
	} catch (error) {
		console.error('❌ Failed to load or test Edge.js wrapper:', error.message);
		console.error('💡 Stack trace:', error.stack);
	}
}

// Run the test
testMindVisionEdgeFixed()
	.then(() => {
		console.log('\n🏁 Test completed!');
		process.exit(0); // Force exit to prevent hanging
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	});
