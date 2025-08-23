// Test script for the mind-vision-edge integration with proper bootstrap sequence
console.log('🧪 Testing Mind Vision Edge.js Integration (Bootstrap Sequence)...\n');

async function testMindVisionEdgeBootstrap() {
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

			// Step 1: Check if bootstrapped (as per your facade service pattern)
			console.log('🔍 Step 1: Checking if plugin is bootstrapped...');
			try {
				const bootstrapped = await mindVision.isBootstrapped();
				console.log('📊 Is bootstrapped:', bootstrapped);
			} catch (error) {
				console.log('⚠️  Bootstrap check error:', error.message);
			}

			// Step 2: Start listening for updates (might be required)
			console.log('🔍 Step 2: Starting to listen for updates...');
			try {
				const listenResult = await mindVision.listenForUpdates();
				console.log('📊 Listen for updates result:', listenResult);
			} catch (error) {
				console.log('⚠️  Listen for updates error:', error.message);
			}

			// Step 3: Now try getCurrentScene
			console.log('🎮 Step 3: Testing getCurrentScene after bootstrap sequence...');
			try {
				// Set a timeout for the entire operation
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Operation timed out after 5 seconds')), 5000);
				});

				const scenePromise = mindVision.getCurrentScene();
				const scene = await Promise.race([scenePromise, timeoutPromise]);

				console.log('🎯 Current scene (after bootstrap):', scene);
				console.log('✅ SUCCESS: getCurrentScene worked after bootstrap!');
			} catch (error) {
				console.log('⚠️  Scene Error:', error.message);

				if (error.message.includes('timed out')) {
					console.log('💡 Still timing out - the plugin might need Hearthstone to be running');
					console.log('💡 Or there might be a different initialization sequence needed');
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
testMindVisionEdgeBootstrap()
	.then(() => {
		console.log('\n🏁 Test completed!');
		process.exit(0); // Force exit to prevent hanging
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	});
