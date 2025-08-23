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
