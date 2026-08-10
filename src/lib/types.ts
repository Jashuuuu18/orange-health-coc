export type UserRole = 'admin' | 'employee'

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  employeeId: string | null
  name: string | null
}

export interface CocRecord {
  rowNumber: number
  employeeId: string
  employeeName: string
  role: string
  date: string | null
  dateRaw: string
  violation: string
  points: number
  remarks: string
}

export interface MasterViolation {
  rowNumber: number
  violation: string
  points: number
  description: string
}

export interface EmployeeSummary {
  employeeId: string
  employeeName: string
  role: string
  totalPoints: number
  totalViolations: number
  lastViolationDate: string | null
}

export interface DashboardSummary {
  totalEmployees: number
  totalViolations: number
  totalPoints: number
  highestPointsHolder: EmployeeSummary | null
  mostCommonViolation: { violation: string; count: number } | null
  recentViolations: CocRecord[]
}
