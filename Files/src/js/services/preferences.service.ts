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
    
    public async setDontRecordAchievements(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, dontRecordAchievements: pref} as Preferences;
        this.savePreferences(newPrefs);
    }
    
    public async setHasSeenVideoCaptureChangeNotif(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, hasSeenVideoCaptureChangeNotif: pref} as Preferences;
        this.savePreferences(newPrefs);
    }

	public async setDecktrackerShowArena(pref: boolean) {
        // TODO: send event to prefs event bus
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowArena: pref} as Preferences;
        this.savePreferences(newPrefs);
    }
    
	public async setDecktrackerShowRanked(pref: boolean) {
        // TODO: send event to prefs event bus
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowRanked: pref} as Preferences;
        this.savePreferences(newPrefs);
	}
    
    private savePreferences(userPrefs: Preferences) {
        this.indexedDb.saveUserPreferences(userPrefs);
    }
}
