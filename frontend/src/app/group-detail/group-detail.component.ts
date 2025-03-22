import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import axios from 'axios';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit {
  groupId!: number;
  groupName = '';
  documents: any[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));

    axios.get(`http://127.0.0.1:8000/groups-with-documents`).then(res => {
      const group = res.data.find((g: any) => g.id === this.groupId);
      if (group) {
        this.groupName = group.name;
        this.documents = group.documents;
      } else {
        this.router.navigate(['/']); // fallback if group not found
      }
    });
  }

  openDoc(filename: string) {
    this.router.navigate(['/read', filename]);
  }
}
