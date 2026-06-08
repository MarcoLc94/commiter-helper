export interface Activity {
  ticket: string | null
  activity: string
  module: string
  status: string
  hours: number
  comments: string
  author: string
}

export interface DayReport {
  date: string
  weekday: string
  day_type: "workday" | "weekend" | "holiday"
  activities: Activity[]
  total_hours: number
}

export interface Repo {
  name: string
  path: string
}

export interface SavedReportSummary {
  id: number
  name: string
  repo_path: string
  author: string
  year: number
  month: number
  created_at: string
  updated_at: string
}

export interface SavedReportDetail extends SavedReportSummary {
  days: DayReport[]
}
