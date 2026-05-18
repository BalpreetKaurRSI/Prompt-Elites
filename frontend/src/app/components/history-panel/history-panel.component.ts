import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HistoryEntry } from '../../models/work-item.model';
import { BreakdownService } from '../../services/breakdown.service';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './history-panel.component.html',
  styleUrls: ['./history-panel.component.scss'],
})
export class HistoryPanelComponent implements OnInit {
  private breakdownService = inject(BreakdownService);

  @Output() loadEntry = new EventEmitter<HistoryEntry>();
  @Output() deleteEntry = new EventEmitter<number>();

  entries: HistoryEntry[] = [];
  loading = true;
  confirmingDeleteId: number | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.breakdownService.getHistory().subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loading = false;
      },
      error: () => {
        this.entries = [];
        this.loading = false;
      },
    });
  }

  onLoad(entry: HistoryEntry): void {
    this.loadEntry.emit(entry);
  }

  requestDelete(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmingDeleteId = id;
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.confirmingDeleteId = null;
  }

  confirmDelete(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmingDeleteId = null;
    this.deleteEntry.emit(id);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
