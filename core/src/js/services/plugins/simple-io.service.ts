import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { OverwolfService } from '../overwolf.service';

@Injectable()
export class SimpleIOService {
	constructor(private readonly ow: OverwolfService) {}

	public async zipAppLogFolder(appName: string): Promise<Blob> {
		const dirListingResult = await this.ow.listFilesInAppDirectory('Firestone');
		const path = dirListingResult.path;
		// It should be a flat structure for us
		const files = dirListingResult.data.filter((d) => d.type === 'file').map((file) => file.name);
		const fileContents: { fileName: string; contents: string }[] = await Promise.all(
			files.map((file) => ({
				fileName: file,
				contents: this.ow.getFileContents(path + '/' + file),
			})),
		);

		const jszip = new JSZip.default();
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
