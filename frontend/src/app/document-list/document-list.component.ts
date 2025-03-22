import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../services/group.service';

interface Group {
  id: number;
  name: string;
  documents: any[];
}

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  groups: Group[] = [];
  newGroupName: string = '';
  showCreateForm: boolean = false;
  activeGroupId: number | null = null;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute
  ) {
    // Subscribe to refresh events
    this.groupService.refresh$.subscribe(() => {
      this.loadGroups();
    });

    // Subscribe to route changes to update active group
    this.route.params.subscribe(params => {
      this.activeGroupId = params['id'] ? +params['id'] : null;
    });
  }

  ngOnInit() {
    this.loadGroups();
  }

  async loadGroups() {
    try {
      this.groups = await this.groupService.getGroups();
    } catch (error) {
      console.error('Error loading groups:', error);
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
    }
  }
}