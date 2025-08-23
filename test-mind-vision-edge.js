// Test script for the mind-vision-edge integration
console.log('🧪 Testing Mind Vision Edge.js Integration...\n');

async function testMindVisionEdge() {
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
            
            // Test getCurrentScene
            console.log('🎮 Attempting to get current scene...');
            try {
                const scene = await mindVision.getCurrentScene();
                console.log('🎯 Current scene:', scene);
                console.log('✅ SUCCESS: MindVision is working via Edge.js!');
            } catch (error) {
                console.log('⚠️  Scene Error:', error.message);
                console.log('💡 This might be expected if Hearthstone is not running');
            }
            
            // Test isBootstrapped
            console.log('🔍 Checking if bootstrapped...');
            try {
                const bootstrapped = await mindVision.isBootstrapped();
                console.log('📊 Is bootstrapped:', bootstrapped);
            } catch (error) {
                console.log('⚠️  Bootstrap Error:', error.message);
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
testMindVisionEdge().then(() => {
    console.log('\n🏁 Test completed!');
}).catch((error) => {
    console.error('\n💥 Test failed:', error);
});
