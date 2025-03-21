import { Component, Output, EventEmitter } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  uploadMessage: string = '';

  @Output() fileUploaded = new EventEmitter<void>();

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async uploadFile() {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file!';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      this.uploadMessage = `Upload successful: ${response.data.filename}`;
      this.fileUploaded.emit();

    } catch (error) {
      console.error('Upload failed:', error);
      this.uploadMessage = 'Upload failed!';
    }
  }
}