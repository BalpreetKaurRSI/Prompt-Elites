import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Breakdown, HistoryEntry, Story, Task, TestCase } from './models/work-item.model';
import { BreakdownService } from './services/breakdown.service';
import { ExportService } from './services/export.service';
import { RequirementsFormComponent } from './components/requirements-form/requirements-form.component';
import { ItemChange, WorkItemBoardComponent } from './components/work-item-board/work-item-board.component';
import { HistoryPanelComponent } from './components/history-panel/history-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatToolbarModule,
    RequirementsFormComponent,
    WorkItemBoardComponent,
    HistoryPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private breakdownService = inject(BreakdownService);
  private exportService = inject(ExportService);

  @ViewChild(HistoryPanelComponent) historyPanel?: HistoryPanelComponent;

  loading = false;
  errorMessage: string | null = null;
  breakdown: Breakdown | null = null;
  showHistory = false;
  saving = false;
  ambiguityDismissed = false;
  testCases: TestCase[] = [];
  generatingTests = false;
  testCaseError: string | null = null;

  onSubmit(payload: {
    projectName: string;
    requirements: string;
    extraContext: string;
    jiraLinks: string;
    documentText: string;
  }): void {
    this.loading = true;
    this.errorMessage = null;
    this.breakdown = null;

    this.breakdownService
      .generate({
        project_name: payload.projectName,
        requirements: payload.requirements,
        extra_context: payload.extraContext || undefined,
        jira_links: payload.jiraLinks || undefined,
        document_text: payload.documentText || undefined,
      })
      .subscribe({
        next: (result) => {
          this.breakdown = result;
          this.ambiguityDismissed = false;
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          const detail =
            err.error && typeof err.error === 'object' && 'detail' in err.error
              ? (err.error as { detail: string }).detail
              : err.message || 'Unknown error';
          this.errorMessage = `Failed to generate breakdown: ${detail}`;
          this.loading = false;
        },
      });
  }

  onItemChange(change: ItemChange): void {
    if (!this.breakdown) return;
    const { kind, item } = change;
    if (kind === 'story') {
      this.breakdown.stories = this.replaceById(this.breakdown.stories, item as Story);
    } else if (kind === 'task') {
      this.breakdown.tasks = this.replaceById(this.breakdown.tasks, item as Task);
    }
    this.breakdown = { ...this.breakdown };
  }

  onItemDelete(change: ItemChange): void {
    if (!this.breakdown) return;
    const { kind, item } = change;
    if (kind === 'story') {
      this.breakdown.stories = this.breakdown.stories.filter((s) => s.id !== item.id);
    } else if (kind === 'task') {
      this.breakdown.tasks = this.breakdown.tasks.filter((t) => t.id !== item.id);
    }
    this.breakdown = { ...this.breakdown };
  }

  onItemAdd(change: ItemChange): void {
    if (!this.breakdown) return;
    const { kind, item } = change;
    if (kind === 'story') {
      this.breakdown.stories = [...this.breakdown.stories, item as Story];
    } else if (kind === 'task') {
      this.breakdown.tasks = [...this.breakdown.tasks, item as Task];
    }
    this.breakdown = { ...this.breakdown };
  }

  saveBreakdown(): void {
    if (!this.breakdown?.history_id) return;
    this.saving = true;
    this.breakdownService
      .updateHistory(this.breakdown.history_id, this.breakdown)
      .subscribe({
        next: () => {
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        },
      });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  loadFromHistory(entry: HistoryEntry): void {
    this.loading = true;
    this.breakdownService.getHistoryDetail(entry.id).subscribe({
      next: (detail) => {
        this.breakdown = { ...detail.breakdown, history_id: detail.id };
        this.ambiguityDismissed = false;
        this.loading = false;
        this.showHistory = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  deleteFromHistory(id: number): void {
    this.breakdownService.deleteHistory(id).subscribe({
      next: () => {
        this.historyPanel?.refresh();
      },
    });
  }

  generateTestCases(): void {
    if (!this.breakdown) return;
    this.generatingTests = true;
    this.testCaseError = null;
    this.breakdownService.generateTestCases(this.breakdown).subscribe({
      next: (res) => {
        this.testCases = res.test_cases;
        this.generatingTests = false;
      },
      error: (err) => {
        const detail =
          err.error && typeof err.error === 'object' && 'detail' in err.error
            ? (err.error as { detail: string }).detail
            : err.message || 'Unknown error';
        this.testCaseError = `Failed to generate test cases: ${detail}`;
        this.generatingTests = false;
      },
    });
  }

  dismissAmbiguity(): void {
    this.ambiguityDismissed = true;
  }

  refineRequirements(): void {
    this.breakdown = null;
    this.errorMessage = null;
    this.ambiguityDismissed = false;
    this.testCases = [];
    this.testCaseError = null;
  }

  reset(): void {
    this.breakdown = null;
    this.errorMessage = null;
    this.ambiguityDismissed = false;
    this.testCases = [];
    this.testCaseError = null;
  }

  exportJson(): void {
    if (this.breakdown) this.exportService.exportJson(this.breakdown);
  }

  exportMarkdown(): void {
    if (this.breakdown) this.exportService.exportMarkdown(this.breakdown);
  }

  private replaceById<T extends { id: string }>(list: T[], updated: T): T[] {
    const i = list.findIndex((x) => x.id === updated.id);
    if (i < 0) return list;
    const copy = list.slice();
    copy[i] = updated;
    return copy;
  }
}
