import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-reader',
  templateUrl: './document-reader.component.html',
  styleUrls: ['./document-reader.component.css']
})
export class DocumentReaderComponent implements OnInit {
  filename = '';
  pdfSrc!: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.filename = this.route.snapshot.paramMap.get('filename') || '';
    const rawUrl = `http://127.0.0.1:8000/file/${this.filename}`;
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }
}