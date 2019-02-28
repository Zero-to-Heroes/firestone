import { Injectable } from '@angular/core';

@Injectable()
export class FeatureFlags {

    private _decktracker = true;

	public decktracker() {
        return this._decktracker;
    }

	public achievements() {
        return true;
    }
}
