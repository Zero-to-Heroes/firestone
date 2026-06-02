import { Route } from '@angular/router';
import { ElectronBattlegroundsComponent } from './overlay/electron-battlegrounds.component';
import { ElectronCollectionComponent } from './overlay/electron-collection.component';
import { ElectronLotteryComponent } from './overlay/electron-lottery.component';
import { ElectronOverlayComponent } from './overlay/electron-overlay.component';
import { ElectronSettingsComponent } from './overlay/electron-settings.component';

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: '/overlay',
		pathMatch: 'full',
	},
	{
		path: 'overlay',
		component: ElectronOverlayComponent,
	},
	{
		path: 'settings',
		component: ElectronSettingsComponent,
	},
	{
		path: 'collection',
		component: ElectronCollectionComponent,
	},
	{
		path: 'battlegrounds',
		component: ElectronBattlegroundsComponent,
	},
	{
		path: 'lottery',
		component: ElectronLotteryComponent,
	},
];
