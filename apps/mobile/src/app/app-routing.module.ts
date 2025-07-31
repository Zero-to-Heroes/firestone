import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from '@firestone/shared/web-shell';

@NgModule({
	imports: [RouterModule.forRoot(routes, { enableTracing: false })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
