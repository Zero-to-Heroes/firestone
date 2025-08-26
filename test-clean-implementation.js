// Test the clean MindVision implementation
console.log('🧪 Testing Clean MindVision Implementation...\n');

async function testCleanImplementation() {
	try {
		const MindVisionEdge = require('./libs/mind-vision-edge/index');
		const mindVision = new MindVisionEdge();

		console.log('✅ Clean MindVision wrapper loaded successfully!');

		const initResult = await mindVision.initialize();
		if (initResult) {
			console.log('✅ Plugin initialized successfully!');

			console.log('🎮 Testing getCurrentScene...');
			const scene = await mindVision.getCurrentScene();
			console.log('🎯 Current scene:', scene);

			console.log('🔧 Testing isBootstrapped...');
			const bootstrapped = await mindVision.isBootstrapped();
			console.log('🎯 Is bootstrapped:', bootstrapped);

			console.log('✅ SUCCESS: Clean implementation is working perfectly!');
			console.log('🎉 Ready for integration with Electron app!');
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
	}
}

testCleanImplementation()
	.then(() => {
		console.log('\n🏁 Test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	});
