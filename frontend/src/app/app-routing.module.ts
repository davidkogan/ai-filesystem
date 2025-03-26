import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupListComponent } from './group-list/group-list.component';
import { DocumentReaderComponent } from './document-reader/document-reader.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: GroupListComponent, canActivate: [AuthGuard] },
  { path: 'read/:filename', component: DocumentReaderComponent },
  { path: 'group/:id', component: GroupDetailComponent },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }