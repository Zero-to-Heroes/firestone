import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import {
	BgsBattlePositioningExecutorService,
	BgsBattlePositioningWorkerService,
	BgsBattleSimulationWorkerService,
} from '@firestone/battlegrounds/simulator';
import {
	ElectronClipboardFacadeService,
	ElectronExternalUrlRendererService,
	ElectronFileSystemUIFacadeService,
	ElectronHotkeyHandlerFacadeService,
	ElectronMonitorsFacadeService,
	ElectronOwUtilsFacadeService,
	ElectronRegionInfoFacadeService,
	ElectronScreenshotFacadeService,
	ElectronSystemInfoFacadeService,
	ElectronViewModule,
	ElectronWindowControlsFacadeService,
} from '@firestone/electron/view';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { SettingsViewModule } from '@firestone/settings/view';
import { StandaloneAdService, TebexHeadlessService, TebexService } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	CLIPBOARD_SERVICE_TOKEN,
	EXTERNAL_URL_SERVICE_TOKEN,
	FILE_SYSTEM_UI_SERVICE_TOKEN,
	HOTKEY_HANDLER_SERVICE_TOKEN,
	ILocalizationService,
	LocalizationStandaloneService,
	MONITORS_SERVICE_TOKEN,
	OW_UTILS_SERVICE_TOKEN,
	REGION_INFO_SERVICE_TOKEN,
	SCREENSHOT_SERVICE_TOKEN,
	SYSTEM_INFO_SERVICE_TOKEN,
	WINDOW_CONTROLS_SERVICE_TOKEN,
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
		{ provide: EXTERNAL_URL_SERVICE_TOKEN, useExisting: ElectronExternalUrlRendererService },
		// Dedicated Electron services (facades proxy to main process via IPC)
		{ provide: CLIPBOARD_SERVICE_TOKEN, useExisting: ElectronClipboardFacadeService },
		{ provide: FILE_SYSTEM_UI_SERVICE_TOKEN, useExisting: ElectronFileSystemUIFacadeService },
		{ provide: MONITORS_SERVICE_TOKEN, useExisting: ElectronMonitorsFacadeService },
		{ provide: SYSTEM_INFO_SERVICE_TOKEN, useExisting: ElectronSystemInfoFacadeService },
		{ provide: REGION_INFO_SERVICE_TOKEN, useExisting: ElectronRegionInfoFacadeService },
		{ provide: WINDOW_CONTROLS_SERVICE_TOKEN, useExisting: ElectronWindowControlsFacadeService },
		{ provide: SCREENSHOT_SERVICE_TOKEN, useExisting: ElectronScreenshotFacadeService },
		{ provide: HOTKEY_HANDLER_SERVICE_TOKEN, useExisting: ElectronHotkeyHandlerFacadeService },
		{ provide: OW_UTILS_SERVICE_TOKEN, useExisting: ElectronOwUtilsFacadeService },
		// Use HashLocationStrategy for file:// protocol compatibility
		{ provide: LocationStrategy, useClass: HashLocationStrategy },
		{ provide: BgsBattleSimulationExecutorService, useClass: BgsBattleSimulationWorkerService },
		{ provide: BgsBattlePositioningExecutorService, useClass: BgsBattlePositioningWorkerService },
		{ provide: TebexService, useExisting: TebexHeadlessService },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
