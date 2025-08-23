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
                    
                case "getCurrentScene":
                    return await GetCurrentScene();
                    
                case "getMemoryChanges":
                    return await GetMemoryChanges();
                    
                case "isBootstrapped":
                    return await IsBootstrapped();
                    
                case "listMethods":
                    return ListAvailableMethods();
                    
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
            isInitialized = true;

            return new { success = true, message = "Plugin initialized", pluginType = pluginType.Name };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

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
                // List available methods for debugging
                MethodInfo[] methods = pluginType.GetMethods();
                string availableMethods = string.Join(", ", Array.ConvertAll(methods, m => m.Name));
                return new { error = "getCurrentScene method not found", availableMethods = availableMethods };
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

            // Call the method with the callback
            method.Invoke(mindVisionPlugin, new object[] { callback });
            
            // Wait for the callback to be called with a timeout
            var timeoutTask = Task.Delay(5000); // 5 second timeout
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
            
            if (completedTask == timeoutTask)
            {
                return new { error = "getCurrentScene timed out after 5 seconds" };
            }
            
            var sceneResult = await tcs.Task;
            return new { success = true, scene = sceneResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

    private async Task<object> GetMemoryChanges()
    {
        try
        {
            if (!isInitialized || mindVisionPlugin == null)
            {
                return new { error = "Plugin not initialized" };
            }

            // Try to find and call getMemoryChanges method
            MethodInfo method = pluginType.GetMethod("getMemoryChanges");
            if (method == null)
            {
                return new { error = "getMemoryChanges method not found" };
            }

            // Create a TaskCompletionSource to handle the async callback
            var tcs = new TaskCompletionSource<object>();
            
            // Create a callback delegate that will be called by the plugin
            Action<object> callback = (result) => {
                tcs.SetResult(result);
            };

            // Call the method with the callback
            method.Invoke(mindVisionPlugin, new object[] { callback });
            
            // Wait for the callback to be called
            var changesResult = await tcs.Task;
            return new { success = true, changes = changesResult };
        }
        catch (Exception ex)
        {
            return new { error = ex.Message, stackTrace = ex.StackTrace };
        }
    }

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
            
            // Create a callback delegate that will be called by the plugin
            Action<object> callback = (result) => {
                tcs.SetResult(result);
            };

            // Call the method with true parameter and callback
            method.Invoke(mindVisionPlugin, new object[] { true, callback });
            
            // Wait for the callback to be called
            var bootstrapResult = await tcs.Task;
            return new { success = true, bootstrapped = bootstrapResult };
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
