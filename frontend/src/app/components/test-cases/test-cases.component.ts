import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService, TestCase } from '../../services/api.service';

@Component({
  selector: 'app-test-cases',
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
        <span>Generating test cases...</span>
      </mat-card>
    } @else if (testCases.length > 0) {
      <mat-card class="test-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="section-icon">science</mat-icon>
          <mat-card-title>Test Cases ({{ testCases.length }})</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <mat-accordion>
            @for (tc of testCases; track tc.title; let i = $index) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon class="test-icon">check_box</mat-icon>
                    {{ tc.title }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="test-body">
                  <div class="gherkin-step">
                    <mat-chip class="step-given">GIVEN</mat-chip>
                    <span>{{ tc.given }}</span>
                  </div>
                  <div class="gherkin-step">
                    <mat-chip class="step-when">WHEN</mat-chip>
                    <span>{{ tc.when }}</span>
                  </div>
                  <div class="gherkin-step">
                    <mat-chip class="step-then">THEN</mat-chip>
                    <span>{{ tc.then }}</span>
                  </div>
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
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

    .test-card {
      margin-bottom: 16px;
    }

    .section-icon {
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 8px;
      padding: 6px;
    }

    .test-icon {
      margin-right: 8px;
      color: var(--success);
      font-size: 20px;
    }

    .test-body {
      padding: 8px 0;
    }

    .gherkin-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }

      span {
        font-size: 0.9rem;
        color: var(--text-primary);
        line-height: 1.4;
      }
    }

    .step-given { background: #dbeafe !important; color: #1e40af !important; font-weight: 600 !important; font-size: 0.7rem !important; }
    .step-when { background: #fef3c7 !important; color: #92400e !important; font-weight: 600 !important; font-size: 0.7rem !important; }
    .step-then { background: #d1fae5 !important; color: #065f46 !important; font-weight: 600 !important; font-size: 0.7rem !important; }
  `],
})
export class TestCasesComponent implements OnChanges {
  @Input() requirementId = '';
  @Input() autoLoad = false;

  testCases: TestCase[] = [];
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
        const artifact = res.artifacts.find((a) => a.artifact_type === 'test_cases');
        if (artifact && artifact.content?.test_cases) {
          this.testCases = artifact.content.test_cases;
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }
}
