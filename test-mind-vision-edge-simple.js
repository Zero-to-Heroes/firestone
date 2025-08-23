// Simple test script for the mind-vision-edge integration
console.log('🧪 Testing Mind Vision Edge.js Integration (Simple)...\n');

async function testMindVisionEdgeSimple() {
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

			// List available methods
			console.log('📋 Listing available methods...');
			try {
				const methods = await mindVision.listMethods();
				console.log('🔍 Available methods:');
				methods.forEach((method) => {
					console.log(`  - ${method.name}(${method.parameters.join(', ')}) : ${method.returnType}`);
				});

				console.log('\n✅ SUCCESS: MindVision plugin loaded and methods discovered!');
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
testMindVisionEdgeSimple()
	.then(() => {
		console.log('\n🏁 Test completed!');
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
	});
