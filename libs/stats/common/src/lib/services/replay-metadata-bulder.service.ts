import { Injectable } from '@angular/core';
import { ReplayUploadMetadata } from '../model/replay-upload-metadata';

@Injectable()
export class ReplayMetadataBuilderService {
	public async buildMetadata(game: any): Promise<ReplayUploadMetadata> {
		const metadata: ReplayUploadMetadata = {};
		return metadata;
	}
}
