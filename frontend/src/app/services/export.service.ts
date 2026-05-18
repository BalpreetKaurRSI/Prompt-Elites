import { Injectable } from '@angular/core';
import { Breakdown } from '../models/work-item.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportJson(b: Breakdown): void {
    this.download(
      `${this.slug(b.project_name)}.json`,
      'application/json',
      JSON.stringify(b, null, 2),
    );
  }

  exportMarkdown(b: Breakdown): void {
    const md = this.toMarkdown(b);
    this.download(`${this.slug(b.project_name)}.md`, 'text/markdown', md);
  }

  private toMarkdown(b: Breakdown): string {
    const lines: string[] = [];
    lines.push(`# ${b.project_name}`, '');
    lines.push('## Summary', '', b.summary, '');

    lines.push('## Stories', '');
    if (b.stories.length === 0) lines.push('_No stories._', '');
    for (const s of b.stories) {
      lines.push(`### ${s.id} — ${s.title}  \`${s.story_points} pts\``);
      lines.push('', s.description, '');
      if (s.acceptance_criteria.length) {
        lines.push('**Acceptance criteria:**');
        for (const ac of s.acceptance_criteria) lines.push(`- ${ac}`);
        lines.push('');
      }
    }

    lines.push('## Tasks', '');
    if (b.tasks.length === 0) lines.push('_No tasks._', '');
    for (const t of b.tasks) {
      const parent = t.parent_story_id ? ` (parent: ${t.parent_story_id})` : '';
      lines.push(
        `### ${t.id} — ${t.title}  \`${t.assignee_type}\` \`${t.estimate_hours}h\`${parent}`,
      );
      lines.push('', t.description, '');
    }

    return lines.join('\n');
  }

  private download(filename: string, mime: string, body: string): void {
    const blob = new Blob([body], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private slug(name: string): string {
    return (
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
      'breakdown'
    );
  }
}
