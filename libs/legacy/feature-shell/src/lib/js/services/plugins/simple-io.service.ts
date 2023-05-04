import { Injectable } from '@angular/core';
import { groupByFunction } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import * as JSZip from 'jszip';

// All the old files that we don't want to include in the logs
const EXCLUDED_FILES = [
	'BattlegroundsMinionsTiersWindow',
	'BattlegroundsOverlayButtonWindow',
	'BgsBannedTribes',
	'BgsBattleSimulationOverlay',
	'BgsHeroSelectionOverlay',
	'DeckTrackerOpponentWindow',
	'DeckTrackerWindow',
	'MatchOverlayBattlegroundsMouseOverWindow',
	'MatchOverlayOpponentHandWindow',
	'MercenariesActionQueueWindow',
	'MercenariesOpponentTeamWindow',
	'MercenariesOutOfCombatPlayerTeamWindow',
	'MercenariesOutOfCombatTreasureSelectionWindow',
	'MercenariesPlayerTeamWindow',
	'SecretsHelperWindow',
];
@Injectable()
export class SimpleIOService {
	constructor(private readonly ow: OverwolfService) {}

	public async zipAppLogFolder(appName: string): Promise<Blob> {
		const dirListingResult = await this.ow.listFilesInAppDirectory('Firestone');
		const path = dirListingResult.path;
		// It should be a flat structure for us
		const files = dirListingResult.data.filter((d) => d.type === 'file').map((file) => file.name);
		const groupedFiles = groupByFunction((fileName: string) => fileName.split('.')[0])(files);

		const fileContents: { fileName: string; contents: string }[] = [];
		for (const fileRoot of Object.keys(groupedFiles)) {
			if (EXCLUDED_FILES.includes(fileRoot) || fileRoot.startsWith('Counter')) {
				continue;
			}
			const allFiles = Object.values(groupedFiles[fileRoot]);
			const filesToUpload = allFiles.sort().reverse().slice(0, 5);
			for (const file of filesToUpload) {
				const contents = await this.ow.readTextFile(path + '/' + file);
				fileContents.push({
					fileName: file,
					contents: contents,
				});
			}
		}
		const jszip = new JSZip();
		fileContents.forEach((file) => jszip.file(file.fileName, file.contents));
		const content: Blob = await jszip.generateAsync({
			type: 'blob',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9,
			},
		});
		return content;
	}
}
