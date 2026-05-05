import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService, Requirement } from '../../services/api.service';

@Component({
  selector: 'app-requirement-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="input-container">
      <mat-card class="input-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">edit_note</mat-icon>
          <mat-card-title>Submit a Requirement</mat-card-title>
          <mat-card-subtitle>
            Paste your raw requirement, user story, or upload a document
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Requirement text</mat-label>
            <textarea
              matInput
              [(ngModel)]="rawText"
              rows="8"
              placeholder="As a user, I want to...&#10;&#10;The system should...&#10;&#10;Acceptance criteria:&#10;- ..."
            ></textarea>
            <mat-hint>{{ rawText.length }} characters</mat-hint>
          </mat-form-field>

          <div class="divider-text">
            <span>or</span>
          </div>

          <div
            class="dropzone"
            [class.drag-over]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragOver = false"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <mat-icon>cloud_upload</mat-icon>
            <p>Drag & drop a file here, or click to browse</p>
            <span class="file-types">Supports .txt, .docx, .pdf</span>
            @if (selectedFile) {
              <mat-chip class="selected-file">
                <mat-icon>attach_file</mat-icon>
                {{ selectedFile.name }}
              </mat-chip>
            }
          </div>
          <input
            #fileInput
            type="file"
            hidden
            accept=".txt,.docx,.pdf"
            (change)="onFileSelected($event)"
          />
        </mat-card-content>

        @if (isSubmitting) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-actions align="end">
          <button
            mat-raised-button
            color="primary"
            [disabled]="(!rawText.trim() && !selectedFile) || isSubmitting"
            (click)="submit()"
          >
            <mat-icon>send</mat-icon>
            Analyze Requirement
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .input-container {
      max-width: 700px;
      margin: 0 auto;
    }

    .input-card {
      padding: 24px;
    }

    .header-icon {
      background: linear-gradient(135deg, #3f51b5, #7c4dff);
      color: white;
      border-radius: 12px;
      padding: 8px;
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .full-width {
      width: 100%;
      margin-top: 20px;
    }

    .divider-text {
      display: flex;
      align-items: center;
      margin: 20px 0;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }

      span {
        padding: 0 16px;
        color: var(--text-secondary);
        font-size: 0.85rem;
        text-transform: uppercase;
      }
    }

    .dropzone {
      border: 2px dashed var(--border);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover, &.drag-over {
        border-color: var(--primary);
        background: rgba(63, 81, 181, 0.04);
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--primary);
        opacity: 0.7;
      }

      p {
        margin-top: 8px;
        color: var(--text-primary);
        font-weight: 500;
      }

      .file-types {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .selected-file {
        margin-top: 12px;
      }
    }

    mat-card-actions {
      padding: 16px 0 0;
    }
  `],
})
export class RequirementInputComponent {
  @Output() requirementSubmitted = new EventEmitter<Requirement>();

  rawText = '';
  selectedFile: File | null = null;
  isDragOver = false;
  isSubmitting = false;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submit() {
    this.isSubmitting = true;

    if (this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: (req) => {
          this.isSubmitting = false;
          this.requirementSubmitted.emit(req);
          this.reset();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.snackBar.open('Upload failed: ' + (err.error?.detail || 'Unknown error'), 'Close', { duration: 5000 });
        },
      });
    } else {
      this.api.submitRequirement(this.rawText).subscribe({
        next: (req) => {
          this.isSubmitting = false;
          this.requirementSubmitted.emit(req);
          this.reset();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.snackBar.open('Submission failed: ' + (err.error?.detail || 'Unknown error'), 'Close', { duration: 5000 });
        },
      });
    }
  }

  private reset() {
    this.rawText = '';
    this.selectedFile = null;
  }
}
