import { Component, Input, HostListener } from '@angular/core';
import { GroupService } from '../services/group.service';

@Component({
  selector: 'app-file-upload',
  template: `
    <div 
      class="upload-container"
      [class.drag-active]="isDragging"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <div class="upload-area">
        <input
          #fileInput
          type="file"
          multiple
          accept=".pdf"
          (change)="onFileSelected($event)"
          style="display: none"
        />
        
        <div class="upload-prompt" *ngIf="!selectedFiles.length">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>
            Drag and drop PDF files here<br>
            <span>or</span>
          </p>
          <button class="select-files-btn" (click)="fileInput.click()">
            Select Files
          </button>
        </div>

        <div class="selected-files" *ngIf="selectedFiles.length">
          <div class="file-list">
            <div class="file-item" *ngFor="let file of selectedFiles">
              <i class="fas fa-file-pdf"></i>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button class="remove-file" (click)="removeFile(file)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="upload-actions">
            <button 
              class="upload-btn" 
              [disabled]="uploading" 
              (click)="uploadFiles()"
            >
              <i class="fas" [class.fa-upload]="!uploading" [class.fa-spinner]="uploading" [class.fa-spin]="uploading"></i>
              {{ uploading ? 'Uploading...' : 'Upload Files' }}
            </button>
            <button 
              class="cancel-btn" 
              *ngIf="selectedFiles.length"
              (click)="clearFiles()"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="upload-message" *ngIf="uploadMessage" [class.error]="uploadError">
          <i class="fas" [class.fa-check-circle]="!uploadError" [class.fa-exclamation-circle]="uploadError"></i>
          {{ uploadMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      background: #f8fafc;
      transition: all 0.3s ease;
      margin-bottom: 24px;
    }

    .upload-container.drag-active {
      border-color: #4a90e2;
      background: #f0f7ff;
    }

    .upload-area {
      text-align: center;
    }

    .upload-prompt {
      padding: 32px;
    }

    .upload-prompt i {
      font-size: 48px;
      color: #4a90e2;
      margin-bottom: 16px;
    }

    .upload-prompt p {
      color: #64748b;
      margin: 0 0 16px;
      font-size: 16px;
      line-height: 1.5;
    }

    .upload-prompt span {
      color: #94a3b8;
      font-size: 14px;
    }

    .select-files-btn {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .select-files-btn:hover {
      background: #357abd;
    }

    .file-list {
      margin: 16px 0;
      max-height: 200px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
    }

    .file-item i {
      color: #e74c3c;
      font-size: 20px;
    }

    .file-info {
      flex: 1;
      min-width: 0;
      text-align: left;
    }

    .file-name {
      display: block;
      color: #2c3e50;
      font-size: 14px;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      color: #94a3b8;
      font-size: 12px;
    }

    .remove-file {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .remove-file:hover {
      color: #e74c3c;
      background: #fee2e2;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 16px;
    }

    .upload-btn {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }

    .upload-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .upload-btn:not(:disabled):hover {
      background: #357abd;
    }

    .cancel-btn {
      background: none;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .upload-message {
      margin-top: 16px;
      padding: 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      background: #dcfce7;
      color: #166534;
    }

    .upload-message.error {
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .upload-container {
        padding: 16px;
      }

      .upload-prompt {
        padding: 24px;
      }
    }
  `]
})
export class FileUploadComponent {
  @Input() groupId!: number;
  selectedFiles: File[] = [];
  uploading = false;
  uploadProgress = 0;
  uploadMessage: string | null = null;
  uploadError = false;
  isDragging = false;

  constructor(private groupService: GroupService) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(Array.from(files));
  }

  handleFiles(files: File[]) {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');

    if (nonPdfFiles.length > 0) {
      this.uploadMessage = 'Only PDF files are allowed';
      this.uploadError = true;
      setTimeout(() => {
        this.uploadMessage = null;
        this.uploadError = false;
      }, 3000);
    }

    if (pdfFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...pdfFiles];
      this.uploadMessage = null;
      this.uploadError = false;
    }
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    if (this.selectedFiles.length === 0) {
      this.uploadMessage = null;
      this.uploadError = false;
    }
  }

  clearFiles() {
    this.selectedFiles = [];
    this.uploadMessage = null;
    this.uploadError = false;
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
      formData.append('group_ids', this.groupId.toString());

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