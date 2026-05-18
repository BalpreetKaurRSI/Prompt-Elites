export type AssigneeType = 'dev' | 'qa' | 'design' | 'devops';

export interface Story {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  story_points: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_type: AssigneeType;
  parent_story_id?: string | null;
  estimate_hours: number;
}

export interface AmbiguityWarning {
  area: string;
  concern: string;
  suggestion: string;
}

export interface Breakdown {
  project_name: string;
  summary: string;
  stories: Story[];
  tasks: Task[];
  ambiguity_warnings: AmbiguityWarning[];
  history_id?: number;
}

export interface BreakdownRequest {
  project_name: string;
  requirements: string;
  extra_context?: string;
  jira_links?: string;
  document_text?: string;
}

export interface TestStep {
  step_number: number;
  action: string;
  expected_result: string;
}

export interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  related_story_id?: string | null;
  steps: TestStep[];
}

export interface TestSuiteResponse {
  test_cases: TestCase[];
}

export interface HistoryEntry {
  id: number;
  project_name: string;
  summary: string;
  story_count: number;
  task_count: number;
  created_at: string;
  updated_at: string;
}

export interface HistoryDetail {
  id: number;
  breakdown: Breakdown;
  created_at: string;
  updated_at: string;
}
