import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentReaderComponent } from './document-reader/document-reader.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';

export const routes: Routes = [
  { path: '', component: DocumentListComponent },
  { path: 'read/:filename', component: DocumentReaderComponent },
  { path: 'group/:id', component: GroupDetailComponent },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }