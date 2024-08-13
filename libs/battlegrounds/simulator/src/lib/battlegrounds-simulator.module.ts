import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BgsBattleStatusComponent } from './components/bgs-battle-status.component';
import { BgsHeroPortraitSimulatorComponent } from './components/bgs-hero-portrait-simulator.component';
import { BgsMinusButtonComponent } from './components/bgs-minus-button.component';
import { BgsPlusButtonComponent } from './components/bgs-plus-button.component';
import { BgsSimulatorHeroPowerSelectionComponent } from './components/bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './components/bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from './components/bgs-simulator-minion-selection.component';
import { BattlegroundsSimulatorMinionTierFilterDropdownComponent } from './components/bgs-simulator-minion-tier-filter-dropdown.component';
import { BattlegroundsSimulatorMinionTribeFilterDropdownComponent } from './components/bgs-simulator-minion-tribe-filter-dropdown.component';
import { BgsSimulatorPlayerOverviewComponent } from './components/bgs-simulator-player-overview.component';
import { BgsSimulatorQuestRewardSelectionComponent } from './components/bgs-simulator-quest-reward-selection.component';
import { BgsSimulatorSideComponent } from './components/bgs-simulator-side.component';
import { BgsSimulatorComponent } from './components/bgs-simulator.component';
import { BgsBattlePositioningMockExecutorService } from './services/bgs-battle-positioning-mock-executor.service';
import { BgsBattlePositioningService } from './services/bgs-battle-positioning.service';
import { BgsBattleSimulationMockExecutorService } from './services/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './services/bgs-battle-simulation.service';
import { BgsSimulatorKeyboardControls } from './services/simulator-keyboard-controls.service';

const components = [
	BgsSimulatorComponent,
	BgsBattleStatusComponent,
	BgsSimulatorSideComponent,
	BgsSimulatorPlayerOverviewComponent,
	BgsPlusButtonComponent,
	BgsMinusButtonComponent,
	BgsHeroPortraitSimulatorComponent,
	BgsSimulatorHeroPowerSelectionComponent,
	BgsSimulatorHeroSelectionComponent,
	BgsSimulatorQuestRewardSelectionComponent,
	BgsSimulatorMinionSelectionComponent,
	BattlegroundsSimulatorMinionTierFilterDropdownComponent,
	BattlegroundsSimulatorMinionTribeFilterDropdownComponent,
];

@NgModule({
	imports: [
		CommonModule,
		BrowserModule,
		BrowserAnimationsModule,
		DragDropModule,
		ReactiveFormsModule,
		FormsModule,

		InlineSVGModule.forRoot(),

		ColiseumComponentsModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		BattlegroundsCommonModule,
		BattlegroundsViewModule,
	],
	providers: [
		BgsBattleSimulationMockExecutorService,
		BgsBattleSimulationService,
		BgsBattlePositioningMockExecutorService,
		BgsBattlePositioningService,
		BgsSimulatorKeyboardControls,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsSimulatorModule {}
