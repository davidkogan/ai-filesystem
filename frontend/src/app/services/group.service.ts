import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export interface Group {
  id: number;
  name: string;
  documents: Document[];
}

export interface Document {
  filename: string;
  size_kb: number;
  uploaded_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private refreshSubject = new Subject<void>();
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getRefreshObservable() {
    return this.refreshSubject.asObservable();
  }

  triggerRefresh() {
    this.refreshSubject.next();
  }

  async getGroups(): Promise<Group[]> {
    const response = await fetch(`${this.apiUrl}/groups`);
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    return response.json();
  }

  async getGroupsWithDocuments(): Promise<Group[]> {
    const response = await fetch(`${this.apiUrl}/groups-with-documents`);
    if (!response.ok) {
      throw new Error('Failed to fetch groups with documents');
    }
    return response.json();
  }

  async createGroup(name: string): Promise<Group> {
    const response = await fetch(`${this.apiUrl}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create group');
    }

    return response.json();
  }
} 