import { Component, Input } from '@angular/core';
import { GroupService } from '../services/group.service';
import axios from 'axios';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Input() groupId!: number;
  selectedFiles: File[] = [];
  uploading = false;
  uploadProgress = 0;
  uploadMessage: string | null = null;
  uploadError = false;

  constructor(private groupService: GroupService) {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.selectedFiles = Array.from(files);
    this.uploadMessage = null;
    this.uploadError = false;
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    if (this.selectedFiles.length === 0) {
      this.uploadMessage = null;
      this.uploadError = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getUploadProgress(): number {
    return Math.round(this.uploadProgress);
  }

  async uploadFiles() {
    if (!this.selectedFiles.length) return;

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = null;
    this.uploadError = false;

    try {
      const formData = new FormData();
      this.selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('group_ids', JSON.stringify([this.groupId]));

      const response = await fetch('http://127.0.0.1:8000/upload-multiple', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Upload failed');
      }

      this.uploadMessage = 'Files uploaded successfully!';
      this.uploadError = false;
      this.selectedFiles = [];
      this.groupService.triggerRefresh();
    } catch (error) {
      console.error('Upload error:', error);
      this.uploadMessage = error instanceof Error ? error.message : 'Upload failed';
      this.uploadError = true;
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }
}