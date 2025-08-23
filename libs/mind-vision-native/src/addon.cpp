#include <nan.h>
#include <windows.h>
#include <iostream>
#include <string>

using namespace Nan;
using namespace v8;

// Global handle to the loaded DLL
static HMODULE mindVisionDll = nullptr;

// Function pointer types for C# DLL functions
typedef int (*GetCurrentSceneFunc)();
typedef void (*GetCurrentSceneCallbackFunc)(void (*callback)(int));

// Function pointers
static GetCurrentSceneFunc getCurrentSceneSync = nullptr;
static GetCurrentSceneCallbackFunc getCurrentSceneAsync = nullptr;

// Initialize the DLL and load function pointers
bool InitializeMindVisionDll() {
    if (mindVisionDll != nullptr) {
        return true; // Already initialized
    }

    // Try to load the DLL from the overwolf-plugins directory
    std::string dllPath = "../../overwolf-plugins/UnitySpy.HearthstoneLib.dll";
    mindVisionDll = LoadLibraryA(dllPath.c_str());
    
    if (mindVisionDll == nullptr) {
        // Try alternative path
        dllPath = "./overwolf-plugins/UnitySpy.HearthstoneLib.dll";
        mindVisionDll = LoadLibraryA(dllPath.c_str());
    }
    
    if (mindVisionDll == nullptr) {
        std::cerr << "Failed to load UnitySpy.HearthstoneLib.dll. Error: " << GetLastError() << std::endl;
        return false;
    }

    // Load function pointers
    getCurrentSceneSync = (GetCurrentSceneFunc)GetProcAddress(mindVisionDll, "getCurrentScene");
    
    if (getCurrentSceneSync == nullptr) {
        std::cerr << "Failed to get getCurrentScene function from DLL" << std::endl;
        FreeLibrary(mindVisionDll);
        mindVisionDll = nullptr;
        return false;
    }

    std::cout << "MindVision DLL loaded successfully!" << std::endl;
    return true;
}

// Cleanup function
void CleanupMindVisionDll() {
    if (mindVisionDll != nullptr) {
        FreeLibrary(mindVisionDll);
        mindVisionDll = nullptr;
        getCurrentSceneSync = nullptr;
        getCurrentSceneAsync = nullptr;
    }
}

// Synchronous getCurrentScene wrapper
NAN_METHOD(GetCurrentScene) {
    if (!InitializeMindVisionDll()) {
        Nan::ThrowError("Failed to initialize MindVision DLL");
        return;
    }

    if (getCurrentSceneSync == nullptr) {
        Nan::ThrowError("getCurrentScene function not available");
        return;
    }

    try {
        int scene = getCurrentSceneSync();
        info.GetReturnValue().Set(Nan::New<Number>(scene));
    } catch (...) {
        Nan::ThrowError("Error calling getCurrentScene");
    }
}

// Test function to verify the addon is working
NAN_METHOD(Test) {
    info.GetReturnValue().Set(Nan::New("MindVision Native Addon is working!").ToLocalChecked());
}

// Check if DLL is loaded
NAN_METHOD(IsInitialized) {
    bool initialized = (mindVisionDll != nullptr);
    info.GetReturnValue().Set(Nan::New<Boolean>(initialized));
}

// Initialize the addon
NAN_MODULE_INIT(Init) {
    // Export functions
    Nan::Set(target, Nan::New("test").ToLocalChecked(),
        Nan::GetFunction(Nan::New<FunctionTemplate>(Test)).ToLocalChecked());
    
    Nan::Set(target, Nan::New("getCurrentScene").ToLocalChecked(),
        Nan::GetFunction(Nan::New<FunctionTemplate>(GetCurrentScene)).ToLocalChecked());
    
    Nan::Set(target, Nan::New("isInitialized").ToLocalChecked(),
        Nan::GetFunction(Nan::New<FunctionTemplate>(IsInitialized)).ToLocalChecked());
}

NODE_MODULE(mindvision, Init)
