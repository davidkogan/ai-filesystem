import { Component, Input } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  link: string;
}

@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav class="breadcrumb">
      <a *ngFor="let item of items; let last = last" 
         [routerLink]="item.link"
         [class.active]="last">
        {{ item.label }}
        <i *ngIf="!last" class="fas fa-chevron-right"></i>
      </a>
    </nav>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .breadcrumb a {
      color: #64748b;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: color 0.2s;
    }

    .breadcrumb a:not(.active):hover {
      color: #4a90e2;
    }

    .breadcrumb a.active {
      color: #2c3e50;
      font-weight: 500;
    }

    .breadcrumb i {
      font-size: 12px;
      color: #94a3b8;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
} 