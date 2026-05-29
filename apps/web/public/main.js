const formatMetric = (metric) => {
  if (metric.unit === 'currency') {
    return `$${(metric.value / 1000000).toFixed(1)}M`;
  }

  if (metric.unit === 'percent') {
    return `${metric.value}%`;
  }

  return new Intl.NumberFormat().format(metric.value);
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

async function boot() {
  const [metrics, modules, employees] = await Promise.all([
    loadJson('/api/v1/platform/analytics'),
    loadJson('/api/v1/workforce/modules'),
    loadJson('/api/v1/employees'),
  ]);

  document.querySelector('#metrics').innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric">
          <span>${metric.label}</span>
          <strong>${formatMetric(metric)}</strong>
          <small>Trend: ${metric.trend}</small>
        </article>
      `,
    )
    .join('');

  document.querySelector('#modules').innerHTML = modules
    .map(
      (module) => `
        <article class="module-card">
          <strong>${module.name}</strong>
          <p>Lifecycle stage: ${module.lifecycleStage}</p>
          <span>${module.key}</span>
        </article>
      `,
    )
    .join('');

  document.querySelector('#employees').innerHTML = employees
    .map(
      (employee) => `
        <article class="person-card">
          <strong>${employee.displayName}</strong>
          <p>${employee.designation}<br />${employee.department}</p>
          <span>${employee.employeeNumber} · ${employee.workMode}</span>
        </article>
      `,
    )
    .join('');
}

boot().catch((error) => {
  document.body.innerHTML = `<pre>${error.message}</pre>`;
});
