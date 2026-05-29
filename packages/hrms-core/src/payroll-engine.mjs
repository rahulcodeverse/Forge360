/**
 * @typedef {{ code: string; type: 'earning' | 'deduction' | 'statutory'; amount: number; taxable?: boolean }} PayrollComponent
 * @typedef {{ id: string; country: string; annualCtc: number; paidDays: number; workingDays: number; lopDays: number; components: PayrollComponent[] }} PayrollEmployee
 */

export const indiaPayrollPlugin = {
  country: 'IN',
  /**
   * @param {PayrollEmployee} employee
   * @param {number} gross
   * @returns {PayrollComponent[]}
   */
  calculate(employee, gross) {
    const basic = componentAmount(employee, 'BASIC');
    const pfBase = Math.min(basic, 15000);
    const pf = roundCurrency(pfBase * 0.12);
    const esi = gross <= 21000 ? roundCurrency(gross * 0.0075) : 0;
    return [
      { code: 'PF_EMPLOYEE', type: 'statutory', amount: pf },
      { code: 'ESI_EMPLOYEE', type: 'statutory', amount: esi },
    ];
  },
};

export const usPayrollPlugin = {
  country: 'US',
  /**
   * @param {PayrollEmployee} _employee
   * @param {number} gross
   * @returns {PayrollComponent[]}
   */
  calculate(_employee, gross) {
    return [
      { code: 'SOCIAL_SECURITY', type: 'statutory', amount: roundCurrency(gross * 0.062) },
      { code: 'MEDICARE', type: 'statutory', amount: roundCurrency(gross * 0.0145) },
    ];
  },
};

export const ukPayrollPlugin = {
  country: 'UK',
  /**
   * @param {PayrollEmployee} _employee
   * @param {number} gross
   * @returns {PayrollComponent[]}
   */
  calculate(_employee, gross) {
    return [{ code: 'NI_EMPLOYEE', type: 'statutory', amount: roundCurrency(gross * 0.08) }];
  },
};

export const uaePayrollPlugin = {
  country: 'AE',
  /**
   * @returns {PayrollComponent[]}
   */
  calculate() {
    return [];
  },
};

const plugins = new Map([
  [indiaPayrollPlugin.country, indiaPayrollPlugin],
  [usPayrollPlugin.country, usPayrollPlugin],
  [ukPayrollPlugin.country, ukPayrollPlugin],
  [uaePayrollPlugin.country, uaePayrollPlugin],
]);

/**
 * Runs payroll and links attendance/leave through paid days and LOP.
 * @param {{ month: number; year: number; employees: PayrollEmployee[] }} input
 */
export function runPayroll(input) {
  const items = input.employees.map((employee) => {
    if (employee.workingDays <= 0) throw new Error('workingDays must be positive');

    const prorateFactor = employee.paidDays / employee.workingDays;
    const recurringEarnings = employee.components.filter((component) => component.type === 'earning');
    const gross = roundCurrency(recurringEarnings.reduce((sum, component) => sum + component.amount, 0) * prorateFactor);
    const configuredDeductions = employee.components.filter((component) => component.type === 'deduction');
    const plugin = plugins.get(employee.country);
    if (!plugin) throw new Error(`No payroll plugin registered for country ${employee.country}`);

    const statutoryDeductions = plugin.calculate(employee, gross);
    const totalDeductions = roundCurrency([...configuredDeductions, ...statutoryDeductions].reduce((sum, component) => sum + component.amount, 0));
    const net = roundCurrency(gross - totalDeductions);

    return {
      employeeId: employee.id,
      country: employee.country,
      gross,
      deductions: totalDeductions,
      net,
      lopDays: employee.lopDays,
      components: [...recurringEarnings, ...configuredDeductions, ...statutoryDeductions],
    };
  });

  return {
    month: input.month,
    year: input.year,
    employeeCount: items.length,
    totalGross: roundCurrency(items.reduce((sum, item) => sum + item.gross, 0)),
    totalDeductions: roundCurrency(items.reduce((sum, item) => sum + item.deductions, 0)),
    totalNet: roundCurrency(items.reduce((sum, item) => sum + item.net, 0)),
    items,
  };
}

/**
 * @param {PayrollEmployee} employee
 * @param {string} code
 */
function componentAmount(employee, code) {
  return employee.components.find((component) => component.code === code)?.amount ?? 0;
}

/**
 * @param {number} value
 */
function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
