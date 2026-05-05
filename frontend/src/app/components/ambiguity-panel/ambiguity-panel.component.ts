import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService, AmbiguityItem } from '../../services/api.service';

@Component({
  selector: 'app-ambiguity-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (isLoading) {
      <mat-card class="loading-card">
        <mat-spinner diameter="32"></mat-spinner>
        <span>Checking for ambiguities...</span>
      </mat-card>
    } @else if (ambiguities.length > 0) {
      <mat-card class="ambiguity-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="section-icon">warning</mat-icon>
          <mat-card-title>Ambiguities Detected ({{ ambiguities.length }})</mat-card-title>
          <mat-card-subtitle>These items need clarification before development</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-accordion>
            @for (item of ambiguities; track item.text; let i = $index) {
              <mat-expansion-panel class="ambiguity-item">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="warn-icon">error_outline</mat-icon>
                    <span class="ambiguous-text">"{{ item.text | slice:0:60 }}{{ item.text.length > 60 ? '...' : '' }}"</span>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="ambiguity-details">
                  <div class="detail-row">
                    <mat-chip class="issue-chip">
                      <mat-icon>report_problem</mat-icon>
                      Issue
                    </mat-chip>
                    <p>{{ item.issue }}</p>
                  </div>
                  <div class="detail-row">
                    <mat-chip class="suggestion-chip">
                      <mat-icon>lightbulb</mat-icon>
                      Suggestion
                    </mat-chip>
                    <p>{{ item.suggestion }}</p>
                  </div>
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    } @else if (!isLoading && loaded) {
      <mat-card class="clear-card">
        <mat-icon class="clear-icon">verified</mat-icon>
        <span>No ambiguities detected - requirement is clear!</span>
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

    .ambiguity-card {
      margin-bottom: 16px;
      border-left: 4px solid var(--warning);
    }

    .section-icon {
      background: #fef3c7;
      color: #d97706;
      border-radius: 8px;
      padding: 6px;
    }

    .warn-icon {
      color: var(--warning);
      margin-right: 8px;
      font-size: 20px;
    }

    .ambiguous-text {
      font-style: italic;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .ambiguity-details {
      padding: 8px 0;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }

      p {
        font-size: 0.9rem;
        line-height: 1.5;
        color: var(--text-primary);
        margin: 0;
        padding-top: 4px;
      }
    }

    .issue-chip {
      background: #fee2e2 !important;
      color: #991b1b !important;
      font-size: 0.75rem !important;
      font-weight: 600 !important;

      mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    }

    .suggestion-chip {
      background: #dbeafe !important;
      color: #1e40af !important;
      font-size: 0.75rem !important;
      font-weight: 600 !important;

      mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    }

    .clear-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      margin-bottom: 16px;
      border-left: 4px solid var(--success);

      span { color: var(--text-primary); font-weight: 500; }
    }

    .clear-icon {
      color: var(--success);
    }
  `],
})
export class AmbiguityPanelComponent implements OnChanges {
  @Input() requirementId = '';
  @Input() autoLoad = false;

  ambiguities: AmbiguityItem[] = [];
  isLoading = false;
  loaded = false;

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['requirementId'] && this.requirementId && this.autoLoad) {
      this.load();
    }
  }

  private load() {
    this.isLoading = true;
    this.loaded = false;
    this.api.getArtifacts(this.requirementId).subscribe({
      next: (res) => {
        const artifact = res.artifacts.find((a) => a.artifact_type === 'ambiguity');
        if (artifact && artifact.content?.ambiguities) {
          this.ambiguities = artifact.content.ambiguities;
        }
        this.isLoading = false;
        this.loaded = true;
      },
      error: () => {
        this.isLoading = false;
        this.loaded = true;
      },
    });
  }
}
