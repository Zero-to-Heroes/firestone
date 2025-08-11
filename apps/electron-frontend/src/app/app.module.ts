import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { CardsFacadeService, CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ElectronOverlayComponent } from './overlay/electron-overlay.component';

@NgModule({
	imports: [CommonModule, LegacyFeatureShellModule, RouterModule.forRoot(appRoutes)],
	declarations: [AppComponent, ElectronOverlayComponent],
	providers: [{ provide: CardsFacadeService, useExisting: CardsFacadeStandaloneService }],
	bootstrap: [AppComponent],
})
export class AppModule {}
