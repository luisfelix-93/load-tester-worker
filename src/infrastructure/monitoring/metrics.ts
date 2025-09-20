import { Counter, Gauge, Histogram, Registry } from 'prom-client';

// É uma boa prática criar um registro customizado em vez de usar o global
export const register = new Registry();

// Métrica 1: Contador para jobs processados
export const jobsProcessedCounter = new Counter({
  name: 'jobs_processed_total',
  help: 'Número total de jobs processados',
  labelNames: ['status'], // Labels: 'success' ou 'failure'
});

// Métrica 2: Histograma para a duração dos jobs
export const jobDurationHistogram = new Histogram({
  name: 'job_duration_seconds',
  help: 'Distribuição da duração dos jobs em segundos',
  // Buckets em segundos: 1s, 5s, 10s, 30s, 1min, 2min, 5min
  buckets: [1, 5, 10, 30, 60, 120, 300], 
});

// Métrica 3: Medidor para jobs ativos
export const activeJobsGauge = new Gauge({
  name: 'active_jobs',
  help: 'Número de jobs atualmente em execução',
});

// Registra as métricas no nosso registro customizado
register.registerMetric(jobsProcessedCounter);
register.registerMetric(jobDurationHistogram);
register.registerMetric(activeJobsGauge);
