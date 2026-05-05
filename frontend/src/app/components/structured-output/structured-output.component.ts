import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService, StructuredOutput, TaskItem } from '../../services/api.service';

@Component({
  selector: 'app-structured-output',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (isLoading) {
      <mat-card class="loading-card">
        <mat-spinner diameter="32"></mat-spinner>
        <span>Generating structured output...</span>
      </mat-card>
    } @else if (output) {
      <mat-card class="output-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="section-icon">view_list</mat-icon>
          <mat-card-title>Structured Output</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group animationDuration="200ms">
            <mat-tab label="Summary">
              <div class="tab-content">
                <p class="summary-text">{{ output.summary }}</p>
              </div>
            </mat-tab>

            <mat-tab label="Tasks ({{ output.tasks.length }})">
              <div class="tab-content">
                @for (task of output.tasks; track task.title) {
                  <div class="task-card">
                    <div class="task-header">
                      <h4>{{ task.title }}</h4>
                      <div class="task-meta">
                        <mat-chip [class]="'priority-' + task.priority.toLowerCase()">
                          {{ task.priority }}
                        </mat-chip>
                        <mat-chip class="effort-chip">
                          <mat-icon>schedule</mat-icon>
                          {{ task.effort }}
                        </mat-chip>
                      </div>
                    </div>
                    <p class="task-description">{{ task.description }}</p>
                  </div>
                }
              </div>
            </mat-tab>

            <mat-tab label="Acceptance Criteria ({{ output.acceptance_criteria.length }})">
              <div class="tab-content">
                <mat-list>
                  @for (criterion of output.acceptance_criteria; track criterion; let i = $index) {
                    <mat-list-item>
                      <mat-icon matListItemIcon class="check-icon">check_circle</mat-icon>
                      <span matListItemTitle>{{ criterion }}</span>
                    </mat-list-item>
                  }
                </mat-list>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .loading-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      margin-bottom: 16px;

      span { color: var(--text-secondary); }
    }

    .output-card {
      margin-bottom: 16px;
    }

    .section-icon {
      background: #e8eaf6;
      color: #3f51b5;
      border-radius: 8px;
      padding: 6px;
    }

    .tab-content {
      padding: 20px 4px;
    }

    .summary-text {
      font-size: 1rem;
      line-height: 1.7;
      color: var(--text-primary);
    }

    .task-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;

      h4 {
        font-size: 0.95rem;
        font-weight: 600;
      }
    }

    .task-meta {
      display: flex;
      gap: 8px;
    }

    .task-description {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .priority-high { background: #fee2e2 !important; color: #991b1b !important; }
    .priority-medium { background: #fef3c7 !important; color: #92400e !important; }
    .priority-low { background: #d1fae5 !important; color: #065f46 !important; }

    .effort-chip {
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
    }

    .check-icon {
      color: var(--success);
    }
  `],
})
export class StructuredOutputComponent implements OnChanges {
  @Input() requirementId = '';
  @Input() autoLoad = false;

  output: StructuredOutput | null = null;
  isLoading = false;

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['requirementId'] && this.requirementId && this.autoLoad) {
      this.load();
    }
  }

  private load() {
    this.isLoading = true;
    this.api.getArtifacts(this.requirementId).subscribe({
      next: (res) => {
        const artifact = res.artifacts.find((a) => a.artifact_type === 'structured_output');
        if (artifact) {
          this.output = artifact.content as StructuredOutput;
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }
}
