import { Injectable } from '@angular/core';

@Injectable()
export class FeatureFlags {

    private _decktracker = false;

	public decktracker() {
        return this._decktracker;
    }

	public achievements() {
        return true;
    }
}
