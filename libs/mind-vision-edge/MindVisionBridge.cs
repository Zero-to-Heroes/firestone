using System;
using System.Threading.Tasks;
using System.Reflection;
using System.IO;

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
            string method = (string)input.method;
            switch (method)
            {
                case "initialize":
                    return await InitializePlugin();
                    
                case "getCurrentScene":
                    return await GetCurrentScene();
                    
                case "isBootstrapped":
                    return await IsBootstrapped();
                    
                case "getMemoryChanges":
                    return await GetMemoryChanges();
                    
                case "listenForUpdates":
                    return await ListenForUpdates();
                    
                case "isInitialized":
                    return isInitialized;
                    
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

            string dllPath = Path.Combine(Directory.GetCurrentDirectory(), "overwolf-plugins", "OverwolfUnitySpy.dll");
            
            if (!File.Exists(dllPath))
            {
                return new { success = false, error = "DLL not found at: " + dllPath };
            }

            Assembly assembly = Assembly.LoadFrom(dllPath);
            
            pluginType = assembly.GetType("OverwolfUnitySpy.MindVisionPlugin");
            
            if (pluginType == null)
            {
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

            return new { success = true, message = "Plugin initialized successfully" };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Set up the event handlers that the MindVisionPlugin expects
    private void SetupEventHandlers()
    {
        try
        {
            // Create the event handlers
            Action<object, object> globalEventHandler = (first, second) => {
                // Handle global events (logging, etc.)
            };

            Action<object> memoryUpdateHandler = (update) => {
                // Handle memory updates
            };

            // Initialize the events by setting the backing fields
            var onGlobalEventField = pluginType.GetField("onGlobalEvent", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            if (onGlobalEventField != null)
            {
                onGlobalEventField.SetValue(mindVisionPlugin, globalEventHandler);
            }
            else
            {
                var eventInfo = pluginType.GetEvent("onGlobalEvent");
                if (eventInfo != null)
                {
                    eventInfo.AddEventHandler(mindVisionPlugin, globalEventHandler);
                }
            }

            var onMemoryUpdateField = pluginType.GetField("onMemoryUpdate", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
            if (onMemoryUpdateField != null)
            {
                onMemoryUpdateField.SetValue(mindVisionPlugin, memoryUpdateHandler);
            }
            else
            {
                var eventInfo = pluginType.GetEvent("onMemoryUpdate");
                if (eventInfo != null)
                {
                    eventInfo.AddEventHandler(mindVisionPlugin, memoryUpdateHandler);
                }
            }
        }
        catch (Exception ex)
        {
            throw new Exception("Failed to setup event handlers: " + ex.Message);
        }
    }

    // Start listening for updates like the Overwolf version does
    private void StartListeningForUpdates()
    {
        try
        {
            MethodInfo listenMethod = pluginType.GetMethod("listenForUpdates");
            if (listenMethod != null)
            {
                Action<object> listenCallback = (result) => {
                    // Listening started successfully
                };

                listenMethod.Invoke(mindVisionPlugin, new object[] { listenCallback });
            }
        }
        catch (Exception ex)
        {
            throw new Exception("Failed to start listening for updates: " + ex.Message);
        }
    }

    // Get current scene using the direct approach (bypasses callUnitySpy issues)
    private async Task<object> GetCurrentScene()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Use direct approach to get scene data
            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
            
            if (mindVisionInstance == null)
            {
                return new { success = true, scene = (string)null };
            }

            var getSceneModeMethod = mindVisionInstance.GetType().GetMethod("GetSceneMode");
            var sceneResult = getSceneModeMethod.Invoke(mindVisionInstance, null);
            
            // Return the result as a string like the original plugin would
            string serializedResult = sceneResult != null ? sceneResult.ToString() : null;
            return new { success = true, scene = serializedResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Check if the plugin is bootstrapped using direct approach
    private async Task<object> IsBootstrapped()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
            
            if (mindVisionInstance == null)
            {
                return new { success = true, bootstrapped = false };
            }

            var isBootstrappedMethod = mindVisionInstance.GetType().GetMethod("IsBootstrapped");
            var result = isBootstrappedMethod.Invoke(mindVisionInstance, null);
            
            return new { success = true, bootstrapped = result };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Get memory changes using direct approach
    private async Task<object> GetMemoryChanges()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            var mindVisionProperty = pluginType.GetProperty("MindVision", BindingFlags.NonPublic | BindingFlags.Instance);
            var mindVisionInstance = mindVisionProperty.GetValue(mindVisionPlugin);
            
            if (mindVisionInstance == null)
            {
                return new { success = true, changes = (string)null };
            }

            var getMemoryChangesMethod = mindVisionInstance.GetType().GetMethod("GetMemoryChanges");
            var result = getMemoryChangesMethod.Invoke(mindVisionInstance, null);
            
            // Serialize the result like the original plugin does
            string serializedResult = result != null ? result.ToString() : null;
            return new { success = true, changes = serializedResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    // Listen for updates (already started in initialization, but can be called again)
    private async Task<object> ListenForUpdates()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            MethodInfo listenMethod = pluginType.GetMethod("listenForUpdates");
            if (listenMethod == null)
            {
                return new { error = "listenForUpdates method not found" };
            }

            Action<object> listenCallback = (result) => {
                // Updates are being listened to
            };

            listenMethod.Invoke(mindVisionPlugin, new object[] { listenCallback });
            
            return new { success = true, message = "Listening for updates started" };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }
}