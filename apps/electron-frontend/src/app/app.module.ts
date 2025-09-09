import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ElectronOverlayComponent } from './overlay/electron-overlay.component';

@NgModule({
	imports: [LegacyFeatureShellModule, RouterModule.forRoot(appRoutes)],
	declarations: [AppComponent, ElectronOverlayComponent],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
