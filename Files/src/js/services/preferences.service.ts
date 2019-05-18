import { Injectable, EventEmitter } from '@angular/core';
import { GenericIndexedDbService } from './generic-indexed-db.service';
import { Preferences } from '../models/preferences';
import { BinderPrefs } from '../models/preferences/binder-prefs';

declare var overwolf: any;

@Injectable()
export class PreferencesService {

    public static readonly DECKTRACKER_OVERLAY_DISPLAY = 'DECKTRACKER_OVERLAY_DISPLAY';

    private preferencesEventBus = new EventEmitter<any>();
    
	constructor(private indexedDb: GenericIndexedDbService) {
        // It will create one per window that uses the service, but we don't really care 
        // We just have to always use the one from the MainWindow
		window['preferencesEventBus'] = this.preferencesEventBus;
    }
    
    public getPreferences(): Promise<Preferences> {
        return this.indexedDb.getUserPreferences();
    }
    
    public async setLaunchAppOnGameStart(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, launchAppOnGameStart: pref} as Preferences;
        this.savePreferences(newPrefs);
    }
    
    public async setBinderShowDust(pref: boolean) {
        const prefs = await this.getPreferences();
        const binder = prefs.binder;
        const newBinder = { ...binder, showDust: pref } as BinderPrefs;
        const newPrefs = { ...prefs, binder: newBinder } as Preferences;
        this.savePreferences(newPrefs);
    }
    
    public async setBinderShowCommon(pref: boolean) {
        const prefs = await this.getPreferences();
        const binder = prefs.binder;
        const newBinder = { ...binder, showCommon: pref } as BinderPrefs;
        const newPrefs = { ...prefs, binder: newBinder } as Preferences;
        this.savePreferences(newPrefs);
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
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowArena: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
    }
    
	public async setDecktrackerShowRanked(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowRanked: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
	}
    
	public async setDecktrackerShowTavernBrawl(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowTavernBrawl: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
	}
    
	public async setDecktrackerShowPractice(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowPractice: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
	}
    
	public async setDecktrackerShowFriendly(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowFriendly: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
	}
    
	public async setDecktrackerShowCasual(pref: boolean) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerShowCasual: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
    }
    
	public async setDecktrackerSkin(pref: string) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, decktrackerSkin: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
    }
    
    public async setOverlayDisplayMode(pref: string) {
        const prefs = await this.getPreferences();
        const newPrefs = { ...prefs, overlayDisplayMode: pref} as Preferences;
        this.savePreferences(newPrefs, PreferencesService.DECKTRACKER_OVERLAY_DISPLAY);
    }
    
    private savePreferences(userPrefs: Preferences, eventName: string = null) {
        this.indexedDb.saveUserPreferences(userPrefs);
        if (eventName) {
            const eventBus: EventEmitter<any> = overwolf.windows.getMainWindow().preferencesEventBus;
            eventBus.next({
                name: eventName,
                preferences: userPrefs
            });
        }
    }
}
