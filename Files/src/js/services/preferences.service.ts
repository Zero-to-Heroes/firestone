import { Injectable } from '@angular/core';
import { GenericIndexedDbService } from './generic-indexed-db.service';
import { Preferences } from '../models/preferences';

@Injectable()
export class PreferencesService {

	constructor(private indexedDb: GenericIndexedDbService) {
    }
    
    public getPreferences(): Promise<Preferences> {
        return this.indexedDb.getUserPreferences();
    }
    
    public savePreferences(userPrefs: Preferences) {
        this.indexedDb.saveUserPreferences(userPrefs);
    }
    
    public async setDontConfirmVideoDeletion(dontAsk: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, dontConfirmVideoReplayDeletion: dontAsk} as Preferences;
        this.savePreferences(newPrefs);
    }
    
    public async setHasSeenPityTimerFtue(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, hasSeenPityTimerFtue: pref} as Preferences;
        this.savePreferences(newPrefs);
    }
}
