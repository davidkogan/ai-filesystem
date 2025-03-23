import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService, Group, Document } from '../services/group.service';
import { Subscription } from 'rxjs';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  currentGroup: Group | null = null;
  group: Group | null = null;
  selectedDocument: Document | null = null;
  showPdfModal = false;
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

  openDocument(document: Document) {
    const url = `http://127.0.0.1:8000/file/${encodeURIComponent(document.filename)}`;
    window.open(url, '_blank');
  }

  closeModal() {
    this.showPdfModal = false;
    this.selectedDocument = null;
  }
}
