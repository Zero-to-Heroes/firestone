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
}
