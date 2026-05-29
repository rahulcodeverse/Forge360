export interface PayrollContext {
  employeeId: string;
  tenantId: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  components: Record<string, number>;
  country: string;
}

export interface StatutoryResult {
  employeeDeductions: Record<string, number>;
  employerContributions: Record<string, number>;
  tds: number;
}

export interface PayrollPlugin {
  countryCode: string;
  compute(context: PayrollContext): Promise<StatutoryResult>;
}
