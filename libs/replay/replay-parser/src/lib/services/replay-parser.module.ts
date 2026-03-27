import { ModuleWithProviders, NgModule } from '@angular/core';

@NgModule({
	declarations: [],
	imports: [],
	exports: [],
})
export class ReplayParserModule {
	static forRoot(): ModuleWithProviders<ReplayParserModule> {
		return {
			ngModule: ReplayParserModule,
			providers: [],
		};
	}
}
