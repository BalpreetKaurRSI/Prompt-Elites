import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AssigneeType,
  Story,
  Task,
} from '../../models/work-item.model';

export type WorkItemKind = 'story' | 'task';

@Component({
  selector: 'app-work-item-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './work-item-card.component.html',
  styleUrls: ['./work-item-card.component.scss'],
})
export class WorkItemCardComponent implements OnInit {
  @Input({ required: true }) kind!: WorkItemKind;
  @Input({ required: true }) item!: Story | Task;
  @Input() autoEdit = false;
  @Output() itemChange = new EventEmitter<Story | Task>();
  @Output() itemDelete = new EventEmitter<Story | Task>();

  isEditing = false;
  expanded = false;
  confirmingDelete = false;
  draft: any = {};

  readonly storyPointsOptions = [1, 2, 3, 5, 8, 13, 21];
  readonly assigneeOptions: AssigneeType[] = ['dev', 'qa', 'design', 'devops'];

  ngOnInit(): void {
    if (this.autoEdit) {
      this.startEdit();
    }
  }

  get story(): Story | null {
    return this.kind === 'story' ? (this.item as Story) : null;
  }
  get task(): Task | null {
    return this.kind === 'task' ? (this.item as Task) : null;
  }

  get assigneeClass(): string {
    return this.task ? `assignee-${this.task.assignee_type}` : '';
  }

  toggleExpand(): void {
    if (!this.isEditing && !this.confirmingDelete) {
      this.expanded = !this.expanded;
    }
  }

  requestDelete(): void {
    this.confirmingDelete = true;
  }

  cancelDelete(): void {
    this.confirmingDelete = false;
  }

  confirmDeleteAction(): void {
    this.confirmingDelete = false;
    this.itemDelete.emit(this.item);
  }

  startEdit(): void {
    this.expanded = true;
    this.draft = JSON.parse(JSON.stringify(this.item));
    if (this.kind === 'story') {
      this.draft._acText = (this.draft.acceptance_criteria || []).join('\n');
    }
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.draft = {};
  }

  saveEdit(): void {
    if (this.kind === 'story') {
      this.draft.acceptance_criteria = this.splitLines(this.draft._acText);
      delete this.draft._acText;
      this.draft.story_points = Number(this.draft.story_points);
    }
    if (this.kind === 'task') {
      this.draft.estimate_hours = Number(this.draft.estimate_hours);
      if (this.draft.parent_story_id === '') {
        this.draft.parent_story_id = null;
      }
    }
    this.itemChange.emit(this.draft);
    this.isEditing = false;
  }

  private splitLines(text: string | undefined): string[] {
    return (text || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
