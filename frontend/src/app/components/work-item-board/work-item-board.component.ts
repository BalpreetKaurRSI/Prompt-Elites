import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Breakdown, Story, Task } from '../../models/work-item.model';
import { WorkItemCardComponent, WorkItemKind } from '../work-item-card/work-item-card.component';

export interface ItemChange {
  kind: WorkItemKind;
  item: Story | Task;
}

@Component({
  selector: 'app-work-item-board',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, WorkItemCardComponent],
  templateUrl: './work-item-board.component.html',
  styleUrls: ['./work-item-board.component.scss'],
})
export class WorkItemBoardComponent {
  @Input({ required: true }) breakdown!: Breakdown;
  @Output() itemChange = new EventEmitter<ItemChange>();
  @Output() itemDelete = new EventEmitter<ItemChange>();
  @Output() itemAdd = new EventEmitter<ItemChange>();

  newItemIds = new Set<string>();

  onChange(kind: WorkItemKind, item: Story | Task): void {
    this.newItemIds.delete(item.id);
    this.itemChange.emit({ kind, item });
  }

  onDelete(kind: WorkItemKind, item: Story | Task): void {
    this.newItemIds.delete(item.id);
    this.itemDelete.emit({ kind, item });
  }

  isNew(id: string): boolean {
    return this.newItemIds.has(id);
  }

  addStory(): void {
    const nextId = this.nextId('STORY', this.breakdown.stories);
    const story: Story = {
      id: nextId,
      title: 'New story',
      description: '',
      acceptance_criteria: [],
      story_points: 3,
    };
    this.newItemIds.add(nextId);
    this.itemAdd.emit({ kind: 'story', item: story });
  }

  addTask(): void {
    const nextId = this.nextId('TASK', this.breakdown.tasks);
    const task: Task = {
      id: nextId,
      title: 'New task',
      description: '',
      assignee_type: 'dev',
      parent_story_id: null,
      estimate_hours: 4,
    };
    this.newItemIds.add(nextId);
    this.itemAdd.emit({ kind: 'task', item: task });
  }

  private nextId(prefix: string, items: { id: string }[]): string {
    let max = 0;
    for (const item of items) {
      const match = item.id.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    }
    return `${prefix}-${max + 1}`;
  }
}
