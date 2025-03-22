import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../services/group.service';
import { Subscription } from 'rxjs';

interface Group {
  id: number;
  name: string;
  documents: Document[];
}

interface Document {
  id: number;
  filename: string;
  size_kb: number;
  uploaded_at: string;
}

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  currentGroup: Group | null = null;
  private refreshSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService
  ) {
    this.refreshSubscription = this.groupService.refresh$.subscribe(() => {
      this.loadGroupData();
    });
  }

  ngOnInit() {
    this.loadGroupData();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  async loadGroupData() {
    const groupId = this.route.snapshot.params['id'];
    if (!groupId) {
      await this.router.navigate(['/']);
      return;
    }

    try {
      const groups = await this.groupService.getGroups();
      console.log('Groups from API:', groups);
      
      this.currentGroup = groups.find((g: Group) => g.id === +groupId) || null;
      console.log('Current group:', this.currentGroup);
      
      if (!this.currentGroup) {
        await this.router.navigate(['/']);
        return;
      }

      // Sort documents by upload date (newest first)
      if (this.currentGroup.documents) {
        console.log('Documents before sort:', this.currentGroup.documents);
        this.currentGroup.documents.sort((a, b) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        console.log('Documents after sort:', this.currentGroup.documents);
      }
    } catch (error) {
      console.error('Error loading group:', error);
      await this.router.navigate(['/']);
    }
  }

  formatFileSize(sizeKb: number): string {
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(2)} MB`;
    }
    return `${sizeKb.toFixed(2)} KB`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async openDocument(doc: Document) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/file/${encodeURIComponent(doc.filename)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Unexpected content type:', contentType);
      }

      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        console.error('Popup was blocked or failed to open');
        // Fallback: try to download the file instead
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up the blob URL after a delay to ensure it's loaded
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Failed to open the document. Please try again.');
    }
  }
}
