export interface CaseSummary {
  client_name: string | null
  incident_date: string | null
  incident_type: string | null
  injuries: string[]
  providers: string[]
  treatment_status: string | null
  insurance_info: string | null
  case_status: string
}

export interface FollowUpTask {
  task: string
  priority: "low" | "medium" | "high"
  status: "pending" | "completed"
}

export interface Metrics {
  completeness_score: number
  missing_fields: number
  generated_tasks: number
  high_priority_tasks: number
  providers_found: number
}

export interface CaseAnalysis {
  case_summary: CaseSummary
  missing_information: string[]
  follow_up_tasks: FollowUpTask[]
  metrics: Metrics
}
