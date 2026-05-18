import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Breakdown,
  BreakdownRequest,
  HistoryDetail,
  HistoryEntry,
  TestSuiteResponse,
} from '../models/work-item.model';

export interface UploadResponse {
  extracted_text: string;
}

@Injectable({ providedIn: 'root' })
export class BreakdownService {
  private http = inject(HttpClient);
  private base = '/api';

  generate(req: BreakdownRequest): Observable<Breakdown> {
    return this.http.post<Breakdown>(`${this.base}/breakdown`, req);
  }

  uploadDocuments(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }
    return this.http.post<UploadResponse>(`${this.base}/upload`, formData);
  }

  getHistory(): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(`${this.base}/history`);
  }

  getHistoryDetail(id: number): Observable<HistoryDetail> {
    return this.http.get<HistoryDetail>(`${this.base}/history/${id}`);
  }

  updateHistory(id: number, breakdown: Breakdown): Observable<HistoryDetail> {
    return this.http.put<HistoryDetail>(`${this.base}/history/${id}`, breakdown);
  }

  deleteHistory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/history/${id}`);
  }

  generateTestCases(breakdown: Breakdown): Observable<TestSuiteResponse> {
    return this.http.post<TestSuiteResponse>(`${this.base}/test-cases`, { breakdown });
  }
}
