import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  groups: any[] = [];

  constructor(private groupService: GroupService) {}

  ngOnInit(): void {
    this.loadGroups();
  
    this.groupService.refresh$.subscribe(() => {
      this.loadGroups();
    });
  }

  loadGroups(): void {
    axios.get('http://127.0.0.1:8000/groups-with-documents').then(res => {
      this.groups = res.data;
    });
  }
  
}