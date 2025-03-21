import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentReaderComponent } from './document-reader/document-reader.component';
import { AppRoutingModule } from './app-routing.module'; // ✅ make sure this is here

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    DocumentListComponent,
    DocumentReaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule // ✅ must be in the imports array
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }