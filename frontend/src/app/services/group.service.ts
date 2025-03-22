import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private refreshTrigger = new BehaviorSubject<void>(undefined);
  refresh$ = this.refreshTrigger.asObservable();

  constructor() {}

  triggerRefresh() {
    this.refreshTrigger.next();
  }

  async getGroups() {
    try {
      const response = await axios.get('http://127.0.0.1:8000/groups-with-documents');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  async createGroup(name: string) {
    try {
      const response = await axios.post('http://127.0.0.1:8000/groups', {
        name: name.trim()
      });
      this.triggerRefresh();
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('A group with this name already exists');
      }
      throw error;
    }
  }
} 