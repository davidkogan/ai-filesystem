import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService, Group } from '../services/group.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit, OnDestroy {
  groups: Group[] = [];
  newGroupName: string = '';
  showCreateForm: boolean = false;
  activeGroupId: number | null = null;
  loading: boolean = true;
  error: string | null = null;
  private refreshSubscription: Subscription;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute
  ) {
    this.refreshSubscription = this.groupService.getRefreshObservable()
      .subscribe(() => {
        this.loadGroups();
      });

    this.route.params.subscribe(params => {
      this.activeGroupId = params['id'] ? +params['id'] : null;
    });
  }

  ngOnInit() {
    this.loadGroups();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  async loadGroups() {
    try {
      this.loading = true;
      this.error = null;
      this.groups = await this.groupService.getGroupsWithDocuments();
    } catch (error) {
      console.error('Error loading groups:', error);
      this.error = 'Failed to load groups';
    } finally {
      this.loading = false;
    }
  }

  async createGroupAndClose() {
    if (!this.newGroupName.trim()) return;
    
    try {
      await this.groupService.createGroup(this.newGroupName);
      this.newGroupName = '';
      this.showCreateForm = false;
      await this.loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      if (error instanceof Error) {
        this.error = error.message;
      } else {
        this.error = 'Failed to create group';
      }
    }
  }

  async openDocument(filename: string) {
    try {
      const url = `http://127.0.0.1:8000/documents/${encodeURIComponent(filename)}/file`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
      this.error = 'Failed to open document';
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
}