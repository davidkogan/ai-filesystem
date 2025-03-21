import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import axios from 'axios';

@Component({
  selector: 'app-document-reader',
  templateUrl: './document-reader.component.html',
  styleUrls: ['./document-reader.component.css']
})
export class DocumentReaderComponent implements OnInit {
  filename = '';
  content = '';

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.filename = this.route.snapshot.paramMap.get('filename') || '';
    try {
      const response = await axios.get(`http://127.0.0.1:8000/document/${this.filename}`);
      this.content = response.data;
    } catch (error) {
      this.content = 'Error loading document.';
    }
  }
}