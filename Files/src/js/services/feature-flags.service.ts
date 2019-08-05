import { Injectable } from '@angular/core';

@Injectable()
export class FeatureFlags {
	public decktracker() {
		return true;
	}
}
