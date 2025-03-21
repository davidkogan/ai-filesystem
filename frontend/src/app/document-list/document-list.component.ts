import { Component, OnInit } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  documents: any[] = [];

  async ngOnInit() {
    await this.loadDocuments();
  }
  
  async loadDocuments() {
    try {
      const response = await axios.get('http://127.0.0.1:8000/documents');
      this.documents = response.data.documents;
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }
  
}