import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationState } from '../model/_barrel';
import { MainWindowState } from '../model/main-window-state';
import { MainWindowStoreEvent } from './events/main-window-store-event';

export const MAIN_WINDOW_STORE_SERVICE_TOKEN = new InjectionToken<IMainWindowStoreService>('MainWindowStoreService');

export interface IMainWindowStoreService {
	mainWindowState$$: BehaviorSubject<MainWindowState | null>;
	navigationState$$: BehaviorSubject<NavigationState | null>;
	send(event: MainWindowStoreEvent): void;
}
