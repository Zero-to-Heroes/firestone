import { Injectable } from '@angular/core';
import { ReplayIndex } from '../models/replay-index';
import { buildReplayIndex } from './replay-index-builder';

@Injectable({
	providedIn: 'root',
})
export class ReplayIndexService {
	public buildIndex(replayAsString: string): ReplayIndex {
		return buildReplayIndex(replayAsString);
	}
}
