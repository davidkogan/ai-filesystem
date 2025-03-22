import { Component, Output, EventEmitter } from '@angular/core';
import axios from 'axios';
import { GroupService } from '../group.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  uploadMessage: string = '';

  groups: any[] = [];
  selectedGroupIds: number[] = [];
  newGroupName: string = '';


  @Output() fileUploaded = new EventEmitter<void>();

  constructor(private groupService: GroupService) {}

  ngOnInit() {
    axios.get('http://127.0.0.1:8000/groups').then(res => {
      this.groups = res.data;
    });
  }  

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  createGroup() {
    if (!this.newGroupName.trim()) return;
  
    axios
      .post('http://127.0.0.1:8000/groups', { name: this.newGroupName })
      .then(res => {
        const newGroup = res.data;
        this.groups.push(newGroup);
        this.selectedGroupIds.push(newGroup.id);
        this.newGroupName = '';
      })
      .catch(err => {
        console.error('Group creation failed:', err);
      });
  }   

  async uploadFile() {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file!';
      return;
    }
  
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.selectedGroupIds.forEach(id => {
      formData.append('group_ids', id.toString());
    });
  
    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData);
      this.uploadMessage = `Upload successful: ${response.data.filename}`;
      this.selectedFile = null;
      this.selectedGroupIds = [];
      this.groupService.triggerRefresh();
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err) {
      console.error(err);
      this.uploadMessage = 'Upload failed!';
    }
  }  
  
}