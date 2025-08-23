// Simple debug test script for the mind-vision-edge integration
console.log('🧪 Testing Mind Vision Edge.js Integration (Simple Debug)...\n');

async function testMindVisionEdgeSimpleDebug() {
	try {
		// Load the simple edge wrapper
		const MindVisionEdgeSimple = require('./libs/mind-vision-edge/index-simple');
		const mindVision = new MindVisionEdgeSimple();

		console.log('✅ Simple Edge.js wrapper loaded successfully!');

		// Test initialization
		console.log('🔧 Initializing MindVision plugin...');
		const initResult = await mindVision.initialize();

		if (initResult) {
			console.log('✅ Plugin initialized successfully!');

			// Test isInitialized
			console.log('🔍 Checking initialization status...');
			const isInit = await mindVision.isInitialized();
			console.log('📊 Is initialized:', isInit);

			// Test callback mechanism
			console.log('🔧 Testing callback mechanism...');
			try {
				const callbackTest = await mindVision.testCallback();
				console.log('📊 Callback test result:', callbackTest);
			} catch (error) {
				console.log('⚠️  Callback test error:', error.message);
			}

			// Try synchronous getCurrentScene (this will probably fail, but let's see how)
			console.log('🎮 Attempting synchronous getCurrentScene...');
			try {
				const sceneResult = await mindVision.getCurrentSceneSync();
				console.log('🎯 Scene result:', sceneResult);
			} catch (error) {
				console.log('⚠️  Scene error:', error.message);
			}

			// List methods again
			console.log('📋 Listing available methods...');
			try {
				const methods = await mindVision.listMethods();
				console.log('🔍 Found', methods.length, 'methods');

				// Show just the methods that might be relevant
				const relevantMethods = methods.filter(
					(m) =>
						m.name.includes('getCurrentScene') ||
						m.name.includes('isBootstrapped') ||
						m.name.includes('getMemoryChanges'),
				);

				console.log('🎯 Relevant methods:');
				relevantMethods.forEach((method) => {
					console.log(`  - ${method.name}(${method.parameters.join(', ')}) : ${method.returnType}`);
				});
			} catch (error) {
				console.log('⚠️  Methods Error:', error.message);
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
testMindVisionEdgeSimpleDebug()
	.then(() => {
		console.log('\n🏁 Test completed!');
		process.exit(0); // Force exit
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	});
