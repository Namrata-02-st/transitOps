export const ROLES = {
  ADMIN: 'ADMIN',
  FLEET_MANAGER: 'FLEET_MANAGER',
  DISPATCHER: 'DISPATCHER',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST'
};

export const PERMISSIONS = {
  vehicles: { view: ['ADMIN','FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER','FINANCIAL_ANALYST'], create: ['ADMIN','FLEET_MANAGER'], edit: ['ADMIN','FLEET_MANAGER'], delete: ['ADMIN'], retire: ['ADMIN','FLEET_MANAGER'] },
  drivers:  { view: ['ADMIN','FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER','FINANCIAL_ANALYST'], create: ['ADMIN','FLEET_MANAGER'], edit: ['ADMIN','FLEET_MANAGER'], delete: ['ADMIN'], suspend: ['ADMIN','SAFETY_OFFICER'], updateSafety: ['ADMIN','SAFETY_OFFICER'] },
  trips:    { view: ['ADMIN','DISPATCHER'], create: ['ADMIN','DISPATCHER'], dispatch: ['ADMIN','DISPATCHER'], complete: ['ADMIN','DISPATCHER'], cancel: ['ADMIN','DISPATCHER'] },
  maintenance: { view: ['ADMIN','FLEET_MANAGER'], create: ['ADMIN','FLEET_MANAGER'], complete: ['ADMIN','FLEET_MANAGER'], cancel: ['ADMIN','FLEET_MANAGER'] },
  fuel:     { view: ['ADMIN','FINANCIAL_ANALYST'], create: ['ADMIN','FINANCIAL_ANALYST'], edit: ['ADMIN','FINANCIAL_ANALYST'], delete: ['ADMIN'] },
  expenses: { view: ['ADMIN','FINANCIAL_ANALYST'], create: ['ADMIN','FINANCIAL_ANALYST'], edit: ['ADMIN','FINANCIAL_ANALYST'], delete: ['ADMIN'] },
  reports:  { view: ['ADMIN','FINANCIAL_ANALYST'] },
  users:    { view: ['ADMIN'], manage: ['ADMIN'] }
};

export const can = (userRole, module, action) => {
  const perms = PERMISSIONS[module];
  if (!perms || !perms[action]) return false;
  return perms[action].includes(userRole);
};
