import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from '@firestone/shared/web-shell';
import { InlineSVGModule } from 'ng-inline-svg-2';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideHttpClient(),
		provideAnimations(),
		importProvidersFrom(InlineSVGModule.forRoot()),
	],
};
