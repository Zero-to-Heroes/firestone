using System;
using System.Threading.Tasks;
using System.Reflection;
using System.IO;
using System.Collections.Generic;

public class Startup
{
    // Static instance to maintain state across calls
    private static object mindVisionPlugin = null;
    private static Type pluginType = null;
    private static bool isInitialized = false;

    public async Task<object> Invoke(dynamic input)
    {
        try
        {
            string method = input.method;
            
            switch (method)
            {
                case "initialize":
                    return await InitializePlugin();
                    
                case "getCurrentSceneSync":
                    return GetCurrentSceneSync();
                    
                case "isInitialized":
                    return isInitialized;
                    
                case "listMethods":
                    return ListAvailableMethods();
                    
                case "testCallback":
                    return await TestCallbackMechanism();
                    
                case "getCurrentScene":
                    return await GetCurrentScene();
                    
                case "getCurrentSceneWorking":
                    return await GetCurrentSceneWorking();
                    
                case "getCurrentSceneFixed":
                    return await GetCurrentSceneFixed();
                    
                case "getCurrentSceneWithCallUnitySpy":
                    return await GetCurrentSceneWithCallUnitySpy();
                    
                case "getCurrentSceneOverwolfStyle":
                    return await GetCurrentSceneOverwolfStyle();
                    
                case "getCurrentSceneDebug":
                    return await GetCurrentSceneDebug();
                    
                case "isBootstrapped":
                    return await IsBootstrapped();
                    
                case "listenForUpdates":
                    return await ListenForUpdates();
                    
                case "testDirectCall":
                    return TestDirectCall();
                    
                case "testMindVisionAccess":
                    return TestMindVisionAccess();
                    
                case "testDirectMindVisionCall":
                    return TestDirectMindVisionCall();
                    
                case "checkEventStatus":
                    return CheckEventStatus();
                    
                default:
                    throw new ArgumentException("Unknown method: " + method);
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    private async Task<object> InitializePlugin()
    {
        try
        {
            if (isInitialized)
            {
                return new { success = true, message = "Already initialized" };
            }

            // Load the OverwolfUnitySpy.dll (the correct plugin DLL)
            string dllPath = Path.Combine(Directory.GetCurrentDirectory(), "overwolf-plugins", "OverwolfUnitySpy.dll");
            
            if (!File.Exists(dllPath))
            {
                return new { success = false, error = "DLL not found at: " + dllPath };
            }

            // Load the assembly
            Assembly assembly = Assembly.LoadFrom(dllPath);
            
            // Get the specific MindVisionPlugin class as defined in the Overwolf manifest
            pluginType = assembly.GetType("OverwolfUnitySpy.MindVisionPlugin");
            
            if (pluginType == null)
            {
                // If we can't find the specific type, let's list all available types for debugging
                Type[] types = assembly.GetTypes();
                string availableTypes = string.Join(", ", Array.ConvertAll(types, t => t.FullName));
                return new { success = false, error = "Could not find OverwolfUnitySpy.MindVisionPlugin type", availableTypes = availableTypes };
            }

            // Create an instance of the plugin
            mindVisionPlugin = Activator.CreateInstance(pluginType);
            
            // Set up the event handlers that the plugin expects
            SetupEventHandlers();
            
            // Start listening for updates like the Overwolf version does
            StartListeningForUpdates();
            
            isInitialized = true;

            return new { success = true, message = "Plugin initialized with event handlers and listening started", pluginType = pluginType.Name };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Try to call getCurrentScene synchronously (this will probably fail, but let's see what happens)
    private object GetCurrentSceneSync()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call getCurrentScene method
            MethodInfo method = pluginType.GetMethod("getCurrentScene");
            if (method == null)
            {
                return new { error = "getCurrentScene method not found" };
            }

            // Try calling it with null callback (this will probably fail)
            try
            {
                object result = method.Invoke(mindVisionPlugin, new object[] { null });
                return new { success = true, scene = result, note = "Called with null callback" };
            }
            catch (Exception ex)
            {
                return new { error = "Failed to call with null callback: " + ex.Message };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Properly implemented getCurrentScene with callback handling
    private async Task<object> GetCurrentScene()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call getCurrentScene method
            MethodInfo method = pluginType.GetMethod("getCurrentScene");
            if (method == null)
            {
                return new { error = "getCurrentScene method not found" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            
            // Create a proper C# Action<object> delegate with thread-safe error handling
            Action<object> callback = new Action<object>((result) => {
                try {
                    // The callback might be called from a background thread (Task.Run in the plugin)
                    // Use TrySetResult to handle thread safety
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetResult(result);
                    }
                } catch (Exception ex) {
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetException(ex);
                    }
                }
            });

            // Call the method with the callback
            method.Invoke(mindVisionPlugin, new object[] { callback });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(3000); // 3 second timeout
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { error = "getCurrentScene timed out after 3 seconds" };
            }
            
            var sceneResult = await tcs.Task;
            return new { success = true, scene = sceneResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Test if we can create and invoke a simple callback
    private async Task<object> TestCallbackMechanism()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Create a simple test to see if we can create Action delegates
            bool callbackInvoked = false;
            object callbackResult = null;

            // Create an Action<object> delegate
            Action<object> testCallback = (result) => {
                callbackInvoked = true;
                callbackResult = result;
            };

            // Test if we can invoke it directly
            testCallback("test result");

            if (callbackInvoked)
            {
                return new { success = true, message = "Callback mechanism works", result = callbackResult };
            }
            else
            {
                return new { error = "Callback was not invoked" };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Set up the event handlers that the MindVisionPlugin expects
    // Unlike Overwolf, we need to INITIALIZE the events first, then subscribe to them
    private void SetupEventHandlers()
    {
        try
        {
            // The plugin has two events: onGlobalEvent and onMemoryUpdate
            // In Overwolf, these are automatically initialized, but we need to do it manually
            
            // Create the event handlers first
            Action<object, object> globalEventHandler = (first, second) => {
                // Handle global events (logging, etc.)
                // This is what Logger.Log will be set to in callUnitySpy
            };

            Action<object> memoryUpdateHandler = (update) => {
                // Handle memory updates
            };

            // Now we need to INITIALIZE the events by setting the backing fields
            // The events are likely backed by private fields
            var onGlobalEventField = pluginType.GetField("onGlobalEvent", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            if (onGlobalEventField != null)
            {
                // Set the event to our handler (this initializes it)
                onGlobalEventField.SetValue(mindVisionPlugin, globalEventHandler);
            }
            else
            {
                // Try to find it as a property or use reflection to initialize the event
                var onGlobalEventProperty = pluginType.GetProperty("onGlobalEvent");
                if (onGlobalEventProperty != null)
                {
                    // If it's a property, we might need to use the event add method
                    var eventInfo = pluginType.GetEvent("onGlobalEvent");
                    if (eventInfo != null)
                    {
                        eventInfo.AddEventHandler(mindVisionPlugin, globalEventHandler);
                    }
                }
            }

            var onMemoryUpdateField = pluginType.GetField("onMemoryUpdate", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            if (onMemoryUpdateField != null)
            {
                // Set the event to our handler (this initializes it)
                onMemoryUpdateField.SetValue(mindVisionPlugin, memoryUpdateHandler);
            }
            else
            {
                // Try to find it as a property or use reflection to initialize the event
                var eventInfo = pluginType.GetEvent("onMemoryUpdate");
                if (eventInfo != null)
                {
                    eventInfo.AddEventHandler(mindVisionPlugin, memoryUpdateHandler);
                }
            }
        }
        catch (Exception ex)
        {
            // Don't fail initialization if event setup fails, but this is critical
            throw new Exception("Failed to setup event handlers: " + ex.Message + " - This is critical for the plugin to work");
        }
    }

    // Start listening for updates like the Overwolf version does
    // This mimics the listenForUpdates() call in the facade service
    private void StartListeningForUpdates()
    {
        try
        {
            // Find the listenForUpdates method
            MethodInfo listenMethod = pluginType.GetMethod("listenForUpdates");
            if (listenMethod != null)
            {
                // Create a callback for listenForUpdates
                Action<object> listenCallback = (result) => {
                    // In the Overwolf version, this just resolves a promise
                    // For us, we just need to know that listening has started
                    // Console.WriteLine($"[MindVision] Listen for updates started: {result}");
                };

                // Call listenForUpdates with the callback
                listenMethod.Invoke(mindVisionPlugin, new object[] { listenCallback });
            }
        }
        catch (Exception ex)
        {
            // Don't fail initialization if listenForUpdates fails
            // But this might be important for the plugin to work properly
            throw new Exception("Failed to start listening for updates: " + ex.Message);
        }
    }

    // WORKING version of getCurrentScene that uses the direct approach but provides same interface
    private async Task<object> GetCurrentSceneWorking()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Use the direct approach that we know works, but return the result in the same format as the original
            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
            
            if (mindVisionInstance == null)
            {
                return new { success = true, scene = (string)null };
            }

            var getSceneModeMethod = mindVisionInstance.GetType().GetMethod("GetSceneMode");
            var sceneResult = getSceneModeMethod.Invoke(mindVisionInstance, null);
            
            // Return the result as a string like the original plugin would (serialized)
            string serializedResult = sceneResult != null ? sceneResult.ToString() : null;
            return new { success = true, scene = serializedResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // FIXED version of getCurrentScene that bypasses the problematic callUnitySpy method
    private async Task<object> GetCurrentSceneFixed()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            
            // Create a callback that will be called from our custom Task.Run
            Action<object> callback = new Action<object>((result) => {
                try {
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetResult(result);
                    }
                } catch (Exception ex) {
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetException(ex);
                    }
                }
            });

            // Implement our own version of callUnitySpy that actually works
            Task.Run(() =>
            {
                try
                {
                    // Get the MindVision property and call GetSceneMode() directly
                    var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
                    var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
                    
                    if (mindVisionInstance == null)
                    {
                        callback(null);
                        return;
                    }

                    var getSceneModeMethod = mindVisionInstance.GetType().GetMethod("GetSceneMode");
                    var sceneResult = getSceneModeMethod.Invoke(mindVisionInstance, null);
                    
                    // Return the result directly (we'll handle serialization later if needed)
                    callback(sceneResult != null ? sceneResult.ToString() : null);
                }
                catch (Exception ex)
                {
                    // Handle exceptions the same way the original does
                    callback(null);
                }
            });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(3000); // 3 second timeout
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { error = "getCurrentSceneFixed timed out after 3 seconds" };
            }
            
            var finalResult = await tcs.Task;
            return new { success = true, scene = finalResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Version that properly mimics the original callUnitySpy method
    private async Task<object> GetCurrentSceneWithCallUnitySpy()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            bool callbackInvoked = false;
            object callbackResult = null;
            
            // Create a callback that will be called from our custom callUnitySpy
            Action<object> callback = new Action<object>((result) => {
                try {
                    callbackInvoked = true;
                    callbackResult = result;
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetResult(result);
                    }
                } catch (Exception ex) {
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetException(ex);
                    }
                }
            });

            // Implement our own callUnitySpy that follows the exact same pattern as the original
            Task.Run(() =>
            {
                try
                {
                    // Step 1: Set Logger.Log = onGlobalEvent (line 344 in original)
                    // We need to find the onGlobalEvent field and set Logger.Log to it
                    var onGlobalEventField = pluginType.GetEvent("onGlobalEvent");
                    
                    // Step 2: Check if callback is null (lines 346-350 in original)
                    if (callback == null)
                    {
                        // In the original, it logs and returns without calling callback
                        return;
                    }

                    // Step 3: Execute the action - MindVision?.GetSceneMode() (line 352)
                    var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
                    var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
                    
                    object result = null;
                    if (mindVisionInstance != null)
                    {
                        var getSceneModeMethod = mindVisionInstance.GetType().GetMethod("GetSceneMode");
                        result = getSceneModeMethod.Invoke(mindVisionInstance, null);
                    }

                    // Step 4: Serialize the result (line 353)
                    string serializedResult = result != null ? result.ToString() : null;
                    
                    // Step 5: Call the callback (line 354)
                    callback(serializedResult);
                }
                catch (Exception ex)
                {
                    // Step 6: Handle exceptions (lines 356-375)
                    // The original has complex exception handling, but let's start simple
                    callback(null);
                }
            });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(5000); // 5 second timeout for debugging
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { 
                    error = "getCurrentSceneWithCallUnitySpy timed out after 5 seconds",
                    debug = new {
                        callbackInvoked = callbackInvoked,
                        callbackResult = callbackResult
                    }
                };
            }
            
            var finalResult = await tcs.Task;
            return new { 
                success = true, 
                scene = finalResult,
                debug = new {
                    callbackInvoked = callbackInvoked,
                    callbackResult = callbackResult
                }
            };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Version that exactly mimics the Overwolf facade approach
    private async Task<object> GetCurrentSceneOverwolfStyle()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Find the getCurrentScene method
            MethodInfo method = pluginType.GetMethod("getCurrentScene");
            if (method == null)
            {
                return new { error = "getCurrentScene method not found" };
            }

            // Create a TaskCompletionSource exactly like the Overwolf Promise
            var tcs = new TaskCompletionSource<object>();
            
            // Create the callback exactly like the Overwolf version: (scene) => { resolve(scene); }
            Action<object> callback = (scene) => {
                tcs.TrySetResult(scene);
            };

            try
            {
                // Call the method exactly like Overwolf: plugin.getCurrentScene(callback)
                method.Invoke(mindVisionPlugin, new object[] { callback });
                
                // Wait for the callback with a reasonable timeout
                var timeoutTask = Task.Delay(10000); // 10 second timeout
                var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
                
                if (completedTask == timeoutTask)
                {
                    return new { error = "getCurrentSceneOverwolfStyle timed out after 10 seconds" };
                }
                
                var result = await tcs.Task;
                return new { success = true, scene = result };
            }
            catch (Exception ex)
            {
                return new { error = "Exception during method invoke: " + ex.Message, stackTrace = ex.StackTrace };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Debug version of getCurrentScene with detailed logging
    private async Task<object> GetCurrentSceneDebug()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call getCurrentScene method
            MethodInfo method = pluginType.GetMethod("getCurrentScene");
            if (method == null)
            {
                return new { error = "getCurrentScene method not found" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            bool callbackInvoked = false;
            object callbackResult = null;
            Exception callbackException = null;
            
            // Create a proper C# Action<object> delegate with detailed logging
            Action<object> callback = new Action<object>((result) => {
                try {
                    callbackInvoked = true;
                    callbackResult = result;
                    
                    // The callback might be called from a background thread (Task.Run in the plugin)
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetResult(result);
                    }
                } catch (Exception ex) {
                    callbackException = ex;
                    if (!tcs.Task.IsCompleted)
                    {
                        tcs.TrySetException(ex);
                    }
                }
            });

            // Call the method with the callback
            method.Invoke(mindVisionPlugin, new object[] { callback });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(5000); // 5 second timeout for debug
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { 
                    error = "getCurrentScene timed out after 5 seconds", 
                    debug = new {
                        callbackInvoked = callbackInvoked,
                        callbackResult = callbackResult,
                        callbackException = callbackException != null ? callbackException.Message : "null",
                        methodFound = method != null,
                        pluginInitialized = mindVisionPlugin != null
                    }
                };
            }
            
            var sceneResult = await tcs.Task;
            return new { 
                success = true, 
                scene = sceneResult,
                debug = new {
                    callbackInvoked = callbackInvoked,
                    callbackResult = callbackResult,
                    resultType = sceneResult != null ? sceneResult.GetType().Name : "null"
                }
            };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Check if the plugin is bootstrapped
    private async Task<object> IsBootstrapped()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call isBootstrapped method
            MethodInfo method = pluginType.GetMethod("isBootstrapped");
            if (method == null)
            {
                return new { error = "isBootstrapped method not found" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            
            // Create a proper C# Action<object> delegate with error handling
            Action<object> callback = new Action<object>((result) => {
                try {
                    tcs.TrySetResult(result);
                } catch (Exception ex) {
                    tcs.TrySetException(ex);
                }
            });

            // Call the method with true parameter and callback (as per your facade service)
            method.Invoke(mindVisionPlugin, new object[] { true, callback });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(3000); // 3 second timeout
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { error = "isBootstrapped timed out after 3 seconds" };
            }
            
            var bootstrapResult = await tcs.Task;
            return new { success = true, bootstrapped = bootstrapResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Start listening for updates (this might be needed before getCurrentScene works)
    private async Task<object> ListenForUpdates()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call listenForUpdates method
            MethodInfo method = pluginType.GetMethod("listenForUpdates");
            if (method == null)
            {
                return new { error = "listenForUpdates method not found" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            
            // Create a proper C# Action<object> delegate with error handling
            Action<object> callback = new Action<object>((result) => {
                try {
                    tcs.TrySetResult(result);
                } catch (Exception ex) {
                    tcs.TrySetException(ex);
                }
            });

            // Call the method with callback
            method.Invoke(mindVisionPlugin, new object[] { callback });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(3000); // 3 second timeout
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { error = "listenForUpdates timed out after 3 seconds" };
            }
            
            var listenResult = await tcs.Task;
            return new { success = true, result = listenResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Test calling the plugin method directly to see what happens
    private object TestDirectCall()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call getCurrentScene method
            MethodInfo method = pluginType.GetMethod("getCurrentScene");
            if (method == null)
            {
                return new { error = "getCurrentScene method not found" };
            }

            bool callbackWasCalled = false;
            object callbackResult = null;
            Exception callbackException = null;

            // Create a simple callback that just records what happens
            Action<object> testCallback = (result) => {
                callbackWasCalled = true;
                callbackResult = result;
            };

            try
            {
                // Call the method directly and see if callback gets invoked immediately
                method.Invoke(mindVisionPlugin, new object[] { testCallback });
                
                // Give it more time since the callback is called from Task.Run()
                System.Threading.Thread.Sleep(2000); // Wait 2 seconds
                
                return new { 
                    success = true,
                    message = "Method invoked successfully",
                    callbackWasCalled = callbackWasCalled,
                    callbackResult = callbackResult,
                    note = "This shows if the callback is called synchronously or if we need to wait"
                };
            }
            catch (Exception ex)
            {
                return new { 
                    error = "Exception during method invoke: " + ex.Message,
                    stackTrace = ex.StackTrace,
                    callbackWasCalled = callbackWasCalled,
                    callbackResult = callbackResult
                };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Test accessing the MindVision object directly to see what's happening
    private object TestMindVisionAccess()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to access the MindVision property directly using reflection
            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            if (mindVisionProperty == null)
            {
                return new { error = "MindVision property not found" };
            }

            try
            {
                var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
                
                if (mindVisionInstance == null)
                {
                    return new { 
                        error = "MindVision instance is null", 
                        message = "This means the MindVision constructor failed, probably because Hearthstone is not properly attached",
                        mindVisionPropertyFound = true
                    };
                }
                else
                {
                    return new { 
                        success = true, 
                        message = "MindVision instance is available",
                        mindVisionType = mindVisionInstance.GetType().Name,
                        mindVisionPropertyFound = true
                    };
                }
            }
            catch (Exception ex)
            {
                return new { 
                    error = "Exception accessing MindVision property: " + ex.Message,
                    stackTrace = ex.StackTrace,
                    mindVisionPropertyFound = true
                };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Test calling MindVision.GetSceneMode() directly, bypassing the callUnitySpy method
    private object TestDirectMindVisionCall()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Get the MindVision property
            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            if (mindVisionProperty == null)
            {
                return new { error = "MindVision property not found" };
            }

            var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
            if (mindVisionInstance == null)
            {
                return new { error = "MindVision instance is null" };
            }

            // Call GetSceneMode() directly on the MindVision instance
            var getSceneModeMethod = mindVisionInstance.GetType().GetMethod("GetSceneMode");
            if (getSceneModeMethod == null)
            {
                return new { error = "GetSceneMode method not found on MindVision instance" };
            }

            try
            {
                var sceneResult = getSceneModeMethod.Invoke(mindVisionInstance, null);
                return new { 
                    success = true, 
                    message = "Direct MindVision call successful",
                    scene = sceneResult,
                    resultType = sceneResult != null ? sceneResult.GetType().Name : "null",
                    note = "This bypassed the callUnitySpy method and called MindVision.GetSceneMode() directly"
                };
            }
            catch (Exception ex)
            {
                return new { 
                    error = "Exception calling GetSceneMode directly: " + ex.Message,
                    stackTrace = ex.StackTrace,
                    note = "This shows what exception is preventing the callback from being called"
                };
            }
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Check the status of the events to see if they were properly initialized
    private object CheckEventStatus()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Check onGlobalEvent field/property
            var onGlobalEventField = pluginType.GetField("onGlobalEvent", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            object globalEventValue = null;
            if (onGlobalEventField != null)
            {
                globalEventValue = onGlobalEventField.GetValue(mindVisionPlugin);
            }

            // Check onMemoryUpdate field/property
            var onMemoryUpdateField = pluginType.GetField("onMemoryUpdate", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            object memoryUpdateValue = null;
            if (onMemoryUpdateField != null)
            {
                memoryUpdateValue = onMemoryUpdateField.GetValue(mindVisionPlugin);
            }

            return new {
                success = true,
                onGlobalEventField = onGlobalEventField != null ? "found" : "not found",
                onGlobalEventValue = globalEventValue != null ? "initialized" : "null",
                onMemoryUpdateField = onMemoryUpdateField != null ? "found" : "not found", 
                onMemoryUpdateValue = memoryUpdateValue != null ? "initialized" : "null",
                globalEventType = globalEventValue != null ? globalEventValue.GetType().Name : "null",
                memoryUpdateType = memoryUpdateValue != null ? memoryUpdateValue.GetType().Name : "null"
            };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    private object ListAvailableMethods()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null || pluginType == null)
            {
                return new { error = "Plugin not initialized" };
            }

            MethodInfo[] methods = pluginType.GetMethods();
            var methodList = new List<object>();
            
            foreach (MethodInfo method in methods)
            {
                var parameters = method.GetParameters();
                var paramTypes = new string[parameters.Length];
                for (int i = 0; i < parameters.Length; i++)
                {
                    paramTypes[i] = parameters[i].ParameterType.Name;
                }
                
                methodList.Add(new { 
                    name = method.Name, 
                    returnType = method.ReturnType.Name,
                    parameters = paramTypes
                });
            }
            
            return new { success = true, methods = methodList.ToArray() };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }
}
