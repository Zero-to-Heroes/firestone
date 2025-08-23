{
  "targets": [
    {
      "target_name": "mind-vision-native",
      "sources": [
        "src/addon.cpp"
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "libraries": [
        "-lkernel32.lib",
        "-luser32.lib"
      ],
      "conditions": [
        ["OS=='win'", {
          "defines": [
            "WIN32_LEAN_AND_MEAN",
            "NOMINMAX"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "RuntimeLibrary": 2
            }
          }
        }]
      ]
    }
  ]
}
