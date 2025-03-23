import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentReaderComponent } from './document-reader/document-reader.component';
import { AppRoutingModule } from './app-routing.module';
import { GroupDetailComponent } from './group-detail/group-detail.component';
import { LoginComponent } from './login/login.component';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    DocumentListComponent,
    DocumentReaderComponent,
    GroupDetailComponent,
    LoginComponent,
    PdfViewerComponent,
    BreadcrumbComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class AppModule { }