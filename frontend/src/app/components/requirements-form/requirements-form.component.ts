import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakdownService } from '../../services/breakdown.service';

@Component({
  selector: 'app-requirements-form',
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
    MatProgressBarModule,
  ],
  templateUrl: './requirements-form.component.html',
  styleUrls: ['./requirements-form.component.scss'],
})
export class RequirementsFormComponent {
  private breakdownService = inject(BreakdownService);

  @Input() loading = false;
  @Input() errorMessage: string | null = null;
  @Output() submitForm = new EventEmitter<{
    projectName: string;
    requirements: string;
    extraContext: string;
    jiraLinks: string;
    documentText: string;
  }>();

  projectName = '';
  requirements = '';
  extraContext = '';
  jiraLinks = '';

  uploadedFiles: File[] = [];
  documentText = '';
  uploading = false;
  uploadError: string | null = null;

  readonly acceptedTypes = '.pdf,.docx,.txt,.csv';

  get canSubmit(): boolean {
    return !this.loading && !this.uploading && this.requirements.trim().length >= 20;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    for (let i = 0; i < input.files.length; i++) {
      this.uploadedFiles.push(input.files[i]);
    }
    input.value = '';
    this.uploadFiles();
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length > 0) {
      this.uploadFiles();
    } else {
      this.documentText = '';
    }
  }

  uploadFiles(): void {
    if (this.uploadedFiles.length === 0) {
      this.documentText = '';
      return;
    }
    this.uploading = true;
    this.uploadError = null;

    this.breakdownService.uploadDocuments(this.uploadedFiles).subscribe({
      next: (res) => {
        this.documentText = res.extracted_text;
        this.uploading = false;
      },
      error: (err) => {
        const detail =
          err.error && typeof err.error === 'object' && 'detail' in err.error
            ? (err.error as { detail: string }).detail
            : err.message || 'Upload failed';
        this.uploadError = detail;
        this.uploading = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.canSubmit) return;
    this.submitForm.emit({
      projectName: this.projectName.trim() || 'Untitled project',
      requirements: this.requirements.trim(),
      extraContext: this.extraContext.trim(),
      jiraLinks: this.jiraLinks.trim(),
      documentText: this.documentText.trim(),
    });
  }

  loadExample(): void {
    this.projectName = 'Customer Onboarding Wizard';
    this.requirements =
      'We need a guided onboarding flow for new customers signing up to our SaaS. ' +
      'It should collect company details, invite team members by email, integrate ' +
      'with Google or Microsoft SSO, and set up the first project workspace. ' +
      'After completion the user should land on a personalised dashboard. Mobile ' +
      'web must be supported. We need analytics on drop-off at each step.';
    this.extraContext =
      'Stack: React frontend, Node/Express backend, PostgreSQL. Existing auth uses Auth0.';
    this.jiraLinks = 'PROJ-101\nPROJ-204\nhttps://myteam.atlassian.net/browse/PROJ-305';
  }
}
