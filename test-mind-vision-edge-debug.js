// Debug test script for the mind-vision-edge integration
console.log('🧪 Testing Mind Vision Edge.js Integration (Debug)...\n');

async function testMindVisionEdgeDebug() {
	try {
		// Load the edge wrapper
		const MindVisionEdge = require('./libs/mind-vision-edge');
		const mindVision = new MindVisionEdge();

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

			// Try to call getCurrentScene with a very short timeout
			console.log('🎮 Attempting to get current scene (with 2s timeout)...');
			try {
				// Set a timeout for the entire operation
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Operation timed out after 2 seconds')), 2000);
				});

				const scenePromise = mindVision.getCurrentScene();
				const scene = await Promise.race([scenePromise, timeoutPromise]);

				console.log('🎯 Current scene:', scene);
				console.log('✅ SUCCESS: getCurrentScene worked!');
			} catch (error) {
				console.log('⚠️  Scene Error:', error.message);

				if (error.message.includes('timed out')) {
					console.log('💡 The method is hanging - callback mechanism is not working properly');
				}
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
testMindVisionEdgeDebug()
	.then(() => {
		console.log('\n🏁 Test completed!');
		process.exit(0); // Force exit to prevent hanging
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	});
