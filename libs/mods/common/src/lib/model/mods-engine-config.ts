export type ModsEngineArch = 'x86' | 'x64';

export interface ModsEngineArchConfig {
	readonly bepInExZip: string;
	readonly unstrippedCorlibsBaseUrl: string;
}

export interface ModsEngineConfig {
	readonly x86: ModsEngineArchConfig;
	readonly x64: ModsEngineArchConfig;
	readonly unstrippedLibs: readonly string[];
	readonly doorstopConfigUrl: string;
}

export interface ModsRemoteTrustedMod {
	readonly Name: string;
	readonly Registered: boolean;
	readonly AssemblyName: string;
	readonly Version: string;
	readonly DownloadLink: string | null;
	readonly updateAvailableVersion: string | null;
	readonly alreadyInstalled: boolean;
	readonly lastTrustedVersion: string | null;
	readonly Description?: string | null;
}

export interface ModsRemoteConfig {
	readonly engine: ModsEngineConfig;
	readonly trustedMods: readonly ModsRemoteTrustedMod[];
}

/** Doorstop config for Hearthstone (stripped mscorlib requires unstripped corlib path). */
export const DOORSTOP_CONFIG_INI = `# General options for Unity Doorstop
[General]

# Enable Doorstop?
enabled = true

# Path to the assembly to load and execute
# NOTE: The entrypoint must be of format \`static void Doorstop.Entrypoint.Start()\`
target_assembly=BepInEx\\core\\BepInEx.Preloader.dll

# If true, Unity's output log is redirected to <current folder>\\output_log.txt
redirect_output_log = false

# Overrides the default boot.config file path
boot_config_override =

# If enabled, DOORSTOP_DISABLE env var value is ignored
# USE THIS ONLY WHEN ASKED TO OR YOU KNOW WHAT THIS MEANS
ignore_disable_switch = false

# Options specific to running under Unity Mono runtime
[UnityMono]

# Overrides default Mono DLL search path
# Sometimes it is needed to instruct Mono to seek its assemblies from a different path
# (e.g. mscorlib is stripped in original game)
# This option causes Mono to seek mscorlib and core libraries from a different folder before Managed
# Original Managed folder is added as a secondary folder in the search path
# To specify multiple paths, separate them with semicolons (;)
dll_search_path_override = BepInEx\\unstripped_corlib

# If true, Mono debugger server will be enabled
debug_enabled = false

# When debug_enabled is true, specifies the address to use for the debugger server
debug_address = 127.0.0.1:10000

# If true and debug_enabled is true, Mono debugger server will suspend the game execution until a debugger is attached
debug_suspend = false
`;

/** Minimum unstripped corlibs required for BepInEx on Hearthstone (full set from HsMod/UnstrippedCorlib). */
export const REQUIRED_UNSTRIPPED_LIBS = [
	'mscorlib.dll',
	'Mono.Security.dll',
	'System.Core.dll',
	'System.dll',
	'UniTask.dll',
	'Microsoft.CSharp.dll',
	'Mono.Posix.dll',
	'netstandard.dll',
	'Newtonsoft.Json.dll',
	'System.Configuration.dll',
	'System.Data.dll',
	'System.Net.Http.dll',
	'System.Numerics.dll',
	'System.Runtime.Serialization.dll',
	'System.Security.dll',
	'System.Xml.dll',
	'System.Xml.Linq.dll',
	'UniTask.Linq.dll',
] as const;

export const DEFAULT_MODS_ENGINE_CONFIG: ModsEngineConfig = {
	x86: {
		bepInExZip: 'https://static.zerotoheroes.com/mods/BepInEx_win_x86_5.4.23.5.zip',
		unstrippedCorlibsBaseUrl: 'https://static.zerotoheroes.com/mods/unstripped_corlibs',
	},
	x64: {
		bepInExZip: 'https://static.zerotoheroes.com/mods/BepInEx_win_x64_5.4.23.5.zip',
		unstrippedCorlibsBaseUrl: 'https://static.zerotoheroes.com/mods/unstripped_corlibs_x64',
	},
	unstrippedLibs: [...REQUIRED_UNSTRIPPED_LIBS],
	doorstopConfigUrl: 'https://static.zerotoheroes.com/mods/doorstop_config.ini',
};
