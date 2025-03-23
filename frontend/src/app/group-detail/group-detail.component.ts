import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService, Document } from '../services/group.service';
import { Subscription } from 'rxjs';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface DocumentWithRename extends Document {
  isRenaming?: boolean;
}

interface Group {
  id: number;
  name: string;
  documents: DocumentWithRename[];
}

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  currentGroup: Group | null = null;
  group: Group | null = null;
  selectedDocument: DocumentWithRename | null = null;
  showPdfModal = false;
  showRenameModal = false;
  newDocumentName = '';
  error: string | null = null;
  private refreshSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService
  ) {
    this.refreshSubscription = this.groupService.getRefreshObservable()
      .subscribe(() => {
        if (this.currentGroup) {
          this.loadGroup(this.currentGroup.id);
        }
      });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const groupId = +params['id'];
      this.loadGroup(groupId);
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private async loadGroup(groupId: number) {
    try {
      const groups = await this.groupService.getGroupsWithDocuments();
      this.currentGroup = groups.find((g: Group) => g.id === groupId) || null;
      this.group = this.currentGroup;
    } catch (error) {
      console.error('Error loading group:', error);
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

  openDocument(document: DocumentWithRename) {
    const url = `http://127.0.0.1:8000/file/${encodeURIComponent(document.filename)}`;
    window.open(url, '_blank');
  }

  startRename(event: Event, document: DocumentWithRename) {
    event.stopPropagation();
    document.isRenaming = true;
  }

  cancelRename(document: DocumentWithRename) {
    document.isRenaming = false;
  }

  getFileNameWithoutExtension(filename: string): string {
    return filename.replace(/\.pdf$/i, '');
  }

  async finishRename(document: DocumentWithRename, newName: string) {
    if (!newName.trim()) {
      document.isRenaming = false;
      return;
    }

    const newFilename = `${newName.trim()}.pdf`;
    if (newFilename === document.filename) {
      document.isRenaming = false;
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/documents/${encodeURIComponent(document.filename)}/rename`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_filename: newFilename }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to rename document');
      }

      document.filename = newFilename;
      document.isRenaming = false;
      this.groupService.triggerRefresh();
    } catch (error) {
      console.error('Error renaming document:', error);
      // You might want to show an error message to the user here
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

  closeModal() {
    this.showPdfModal = false;
    this.selectedDocument = null;
  }

  openRenameModal(document: DocumentWithRename) {
    this.selectedDocument = document;
    this.newDocumentName = document.filename;
    this.showRenameModal = true;
    this.error = null;
  }

  closeRenameModal() {
    this.showRenameModal = false;
    this.selectedDocument = null;
    this.newDocumentName = '';
    this.error = null;
  }

  async renameDocument() {
    if (!this.selectedDocument || !this.newDocumentName.trim()) return;

    try {
      await this.groupService.renameDocument(this.selectedDocument.filename, this.newDocumentName.trim());
      this.closeRenameModal();
    } catch (error) {
      console.error('Error renaming document:', error);
      this.error = error instanceof Error ? error.message : 'Failed to rename document';
    }
  }
}
