import { Injectable } from '@angular/core';

@Injectable()
export class FeatureFlags {

    private _achievements = true;

	public achievements() {
        return this._achievements;
    }
}
