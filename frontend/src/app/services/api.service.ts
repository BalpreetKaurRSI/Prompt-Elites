import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Requirement {
  requirement_id: string;
  raw_text: string;
  source_file: string;
  created_at: string;
  status: string;
}

export interface TaskItem {
  title: string;
  description: string;
  effort: string;
  priority: string;
}

export interface StructuredOutput {
  summary: string;
  tasks: TaskItem[];
  acceptance_criteria: string[];
}

export interface TestCase {
  title: string;
  given: string;
  when: string;
  then: string;
}

export interface AmbiguityItem {
  text: string;
  issue: string;
  suggestion: string;
}

export interface ArtifactResponse {
  requirement_id: string;
  artifact_type: string;
  content: any;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  submitRequirement(rawText: string): Observable<Requirement> {
    return this.http.post<Requirement>(`${this.baseUrl}/requirements`, {
      raw_text: rawText,
    });
  }

  uploadFile(file: File): Observable<Requirement> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Requirement>(
      `${this.baseUrl}/requirements/upload`,
      formData
    );
  }

  getRequirements(): Observable<Requirement[]> {
    return this.http.get<Requirement[]>(`${this.baseUrl}/requirements`);
  }

  getRequirement(id: string): Observable<Requirement> {
    return this.http.get<Requirement>(`${this.baseUrl}/requirements/${id}`);
  }

  generateStructuredOutput(id: string): Observable<{ requirement_id: string; content: StructuredOutput }> {
    return this.http.post<{ requirement_id: string; content: StructuredOutput }>(
      `${this.baseUrl}/requirements/${id}/generate`,
      {}
    );
  }

  generateTestCases(id: string): Observable<{ requirement_id: string; content: { test_cases: TestCase[] } }> {
    return this.http.post<{ requirement_id: string; content: { test_cases: TestCase[] } }>(
      `${this.baseUrl}/requirements/${id}/test-cases`,
      {}
    );
  }

  detectAmbiguities(id: string): Observable<{ requirement_id: string; content: { ambiguities: AmbiguityItem[] } }> {
    return this.http.post<{ requirement_id: string; content: { ambiguities: AmbiguityItem[] } }>(
      `${this.baseUrl}/requirements/${id}/ambiguity`,
      {}
    );
  }

  getArtifacts(id: string): Observable<{ requirement_id: string; artifacts: ArtifactResponse[] }> {
    return this.http.get<{ requirement_id: string; artifacts: ArtifactResponse[] }>(
      `${this.baseUrl}/requirements/${id}/artifacts`
    );
  }
}
