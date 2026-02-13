import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ElectronExternalUrlRendererService, ElectronViewModule } from '@firestone/electron/view';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { SettingsViewModule } from '@firestone/settings/view';
import { StandaloneAdService } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	EXTERNAL_URL_SERVICE_TOKEN,
	ILocalizationService,
	LocalizationStandaloneService,
} from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ElectronCollectionComponent } from './overlay/electron-collection.component';
import { ElectronOverlayComponent } from './overlay/electron-overlay.component';
import { ElectronSettingsComponent } from './overlay/electron-settings.component';

@NgModule({
	imports: [
		CommonModule,

		LegacyFeatureShellModule,
		SharedCommonViewModule,
		ElectronViewModule,
		SettingsViewModule,

		RouterModule.forRoot(appRoutes),
	],
	declarations: [AppComponent, ElectronOverlayComponent, ElectronSettingsComponent, ElectronCollectionComponent],
	providers: [
		{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService },
		{ provide: ILocalizationService, useExisting: LocalizationStandaloneService },
		{ provide: LocalizationFacadeService, useExisting: LocalizationStandaloneService },
		{ provide: ADS_SERVICE_TOKEN, useExisting: StandaloneAdService },
		// Renderer-only: no Overwolf dependency; uses electronAPI IPC when in Electron
		{ provide: EXTERNAL_URL_SERVICE_TOKEN, useClass: ElectronExternalUrlRendererService },
		// Use HashLocationStrategy for file:// protocol compatibility
		{ provide: LocationStrategy, useClass: HashLocationStrategy },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
