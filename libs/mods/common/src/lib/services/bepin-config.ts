import { OverwolfService } from '@firestone/shared/framework/core';
import { configLocation, ModData } from '../..';

export interface BepInExConfig {
	AssemblyName: string;
	Name: string;
	Guid: string;
	Version: string;
	DownloadLink: string;
}

export const buildBepInExConfig = async (
	configFile: string,
	assemblyName: string,
	ow: OverwolfService,
): Promise<BepInExConfig> => {
	console.debug('[mods-manager] building bepin-ex config', configFile, assemblyName);
	const config = await ow.readTextFile(configFile);
	// console.debug('[mods-manager] config', config);
	const configObj = parseConfig(config);
	console.debug('[mods-manager] configObj', configObj);
	return {
		AssemblyName: assemblyName,
		Name: configObj.Name,
		Guid: configObj.Guid,
		Version: configObj.Version,
		DownloadLink: configObj.DownloadLink,
	};
};

export const updateModeVersionInBepInExConfig = async (mod: ModData, installPath: string, ow: OverwolfService) => {
	const configFile = `${installPath}\\${configLocation}\\${mod.AssemblyName}.cfg`;
	const config = await ow.readTextFile(configFile);

	// Replace only the Version line, preserving all other content and formatting
	const newConfig = config
		.split('\n')
		.map((line) => {
			// Match lines like "Version = ..." (with optional whitespace)
			if (/^\s*Version\s*=/.test(line)) {
				return `Version = ${mod.Version}`;
			}
			return line;
		})
		.join('\n');

	await ow.writeFileContents(configFile, newConfig);
};

/*
 * Example config:
## Settings file was created by plugin Auto-squelch v1.0.0
## Plugin GUID: com.firestoneapp.mods.bepinex.FirestoneAutoSquelch

[General]

# Setting type: String
# Default value: Auto-squelch
Name = Auto-squelch

# Setting type: String
# Default value: com.firestoneapp.mods.bepinex.FirestoneAutoSquelch
Guid = com.firestoneapp.mods.bepinex.FirestoneAutoSquelch

# Setting type: String
# Default value: 1.0.0
Version = 1.0.0

# Setting type: String
# Default value: https://github.com/Zero-to-Heroes/firestone-bepinex-auto-squelch
DownloadLink = https://github.com/Zero-to-Heroes/firestone-bepinex-auto-squelch

 */
const parseConfig = (config: string): any => {
	const configObj = config
		.split('\n')
		.filter((line) => line.includes('='))
		.reduce((acc, line) => {
			const [key, value] = line.split('=');
			const cleanKey = key.trim();
			const cleanValue = value.replace(/[\r\n]+/g, '').trim();
			acc[cleanKey] = cleanValue;
			return acc;
		}, {});
	return configObj;
};
