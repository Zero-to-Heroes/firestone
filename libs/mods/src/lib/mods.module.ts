import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LegacyFeatureShellModule } from '@firestone/legacy/feature-shell';
import { ModsBootstrapService } from './services/mods-bootstrap.service';

@NgModule({
	imports: [CommonModule, LegacyFeatureShellModule],
	providers: [ModsBootstrapService],
})
export class ModsModule {}
