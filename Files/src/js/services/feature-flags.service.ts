import { Injectable } from '@angular/core';

@Injectable()
export class FeatureFlags {
    
	public decktracker() {
        return false;
    }

	public achievements() {
        return true;
    }
}
