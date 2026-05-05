import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RequirementInputComponent } from '../requirement-input/requirement-input.component';
import { StructuredOutputComponent } from '../structured-output/structured-output.component';
import { TestCasesComponent } from '../test-cases/test-cases.component';
import { AmbiguityPanelComponent } from '../ambiguity-panel/ambiguity-panel.component';
import { ApiService, Requirement } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RequirementInputComponent,
    StructuredOutputComponent,
    TestCasesComponent,
    AmbiguityPanelComponent,
  ],
  template: `
    <div class="dashboard-container">
      <mat-toolbar color="primary" class="toolbar">
        <mat-icon class="toolbar-icon">auto_awesome</mat-icon>
        <span class="toolbar-title">AI SDLC Platform</span>
        <span class="toolbar-subtitle">Requirements to Development Artifacts</span>
      </mat-toolbar>

      <div class="main-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>History</h3>
            <button mat-icon-button (click)="loadRequirements()" aria-label="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
          <mat-nav-list>
            @for (req of requirements; track req.requirement_id) {
              <a mat-list-item
                 [class.active]="selectedRequirement?.requirement_id === req.requirement_id"
                 (click)="selectRequirement(req)">
                <mat-icon matListItemIcon>description</mat-icon>
                <span matListItemTitle>{{ req.raw_text | slice:0:40 }}...</span>
                <span matListItemLine>{{ req.created_at | date:'short' }}</span>
                <mat-chip matListItemMeta [class]="'status-' + req.status">
                  {{ req.status }}
                </mat-chip>
              </a>
            }
            @if (requirements.length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>No requirements yet</p>
              </div>
            }
          </mat-nav-list>
        </aside>

        <main class="content">
          @if (!selectedRequirement) {
            <app-requirement-input
              (requirementSubmitted)="onRequirementSubmitted($event)">
            </app-requirement-input>
          } @else {
            <div class="output-area">
              <div class="output-header">
                <button mat-stroked-button (click)="clearSelection()">
                  <mat-icon>add</mat-icon> New Requirement
                </button>
                <h2>Requirement Analysis</h2>
              </div>

              <div class="requirement-preview">
                <mat-icon>format_quote</mat-icon>
                <p>{{ selectedRequirement.raw_text | slice:0:200 }}{{ selectedRequirement.raw_text.length > 200 ? '...' : '' }}</p>
              </div>

              @if (isProcessing) {
                <div class="processing-indicator">
                  <mat-spinner diameter="40"></mat-spinner>
                  <p>AI is analyzing your requirement...</p>
                </div>
              }

              <app-ambiguity-panel
                [requirementId]="selectedRequirement.requirement_id"
                [autoLoad]="true">
              </app-ambiguity-panel>

              <app-structured-output
                [requirementId]="selectedRequirement.requirement_id"
                [autoLoad]="true">
              </app-structured-output>

              <app-test-cases
                [requirementId]="selectedRequirement.requirement_id"
                [autoLoad]="true">
              </app-test-cases>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 12px;
    }

    .toolbar-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .toolbar-title {
      font-weight: 600;
      font-size: 1.2rem;
    }

    .toolbar-subtitle {
      font-size: 0.85rem;
      opacity: 0.8;
      margin-left: 8px;
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 320px;
      background: white;
      border-right: 1px solid var(--border);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 8px;

      h3 {
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }
    }

    .active {
      background: rgba(63, 81, 181, 0.08) !important;
      border-left: 3px solid var(--primary);
    }

    .status-pending { background: #fef3c7 !important; color: #92400e !important; }
    .status-processing { background: #dbeafe !important; color: #1e40af !important; }
    .status-completed { background: #d1fae5 !important; color: #065f46 !important; }
    .status-error { background: #fee2e2 !important; color: #991b1b !important; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.4;
      }

      p { margin-top: 12px; }
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .output-area {
      max-width: 900px;
      margin: 0 auto;
    }

    .output-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
      }
    }

    .requirement-preview {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 24px;

      mat-icon {
        color: var(--primary);
        flex-shrink: 0;
      }

      p {
        color: var(--text-secondary);
        line-height: 1.5;
        font-style: italic;
      }
    }

    .processing-indicator {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      justify-content: center;

      p {
        color: var(--text-secondary);
        font-size: 0.95rem;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  requirements: Requirement[] = [];
  selectedRequirement: Requirement | null = null;
  isProcessing = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadRequirements();
  }

  loadRequirements() {
    this.api.getRequirements().subscribe({
      next: (reqs) => (this.requirements = reqs),
      error: () => (this.requirements = []),
    });
  }

  selectRequirement(req: Requirement) {
    this.selectedRequirement = req;
  }

  clearSelection() {
    this.selectedRequirement = null;
  }

  onRequirementSubmitted(req: Requirement) {
    this.requirements.unshift(req);
    this.selectedRequirement = req;
    this.processRequirement(req.requirement_id);
  }

  private processRequirement(id: string) {
    this.isProcessing = true;

    this.api.generateStructuredOutput(id).subscribe({
      next: () => {
        this.api.generateTestCases(id).subscribe();
        this.api.detectAmbiguities(id).subscribe({
          complete: () => {
            this.isProcessing = false;
            this.loadRequirements();
          },
        });
      },
      error: () => (this.isProcessing = false),
    });
  }
}
