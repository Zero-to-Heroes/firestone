import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WebsiteProfileCollectionComponent } from './collection/website-profile-collection.component';

const components = [
	WebsiteProfileCollectionComponent,
]

@NgModule({
	imports: [CommonModule],
	declarations: components,
	exports: components
})
export class WebsiteProfileModule {}
