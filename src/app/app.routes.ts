import { Routes } from '@angular/router';
import {SkinsGridComponent} from './skins/skins-grid.component';

export const routes: Routes = [
  { path: '', component: SkinsGridComponent },
  { path: 'skins', component: SkinsGridComponent },
];
