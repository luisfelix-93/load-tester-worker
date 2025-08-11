import { RunLoadTestUseCase } from '../src/services/runLoadTest.usecase';
import nock from 'nock';

describe('RunLoadTestUseCase - Integration', () => {
  let useCase: RunLoadTestUseCase;

  beforeEach(() => {
    nock.cleanAll();
    useCase = new RunLoadTestUseCase();
  });

  it('deve executar o teste e calcular as estatísticas corretamente com sucesso e falha', async () => {
    // Arrange
    const targetUrl = 'http://integration-test.com';
    const numRequests = 5;
    const concurrency = 2;

    // Mock para 3 sucessos e 2 falhas
    nock(targetUrl).get('/').times(3).reply(200, 'OK', { 'Content-Type': 'text/plain' });
    nock(targetUrl).get('/').times(2).reply(500, 'Internal Server Error');

    // Act
    const result = await useCase.execute('int-test-1', `${targetUrl}/`, numRequests, concurrency);

    // Assert
    expect(result.requests).toBe(numRequests);
    expect(result.result.length).toBe(numRequests);

    // Verifica as estatísticas
    expect(result.stats.successCount).toBe(3);
    expect(result.stats.failedCount).toBe(2);

    // Verifica se os cálculos de tempo fazem sentido
    expect(result.stats.totalTime.min).toBeGreaterThan(0);
    expect(result.stats.totalTime.max).toBeGreaterThanOrEqual(result.stats.totalTime.min);
    expect(result.stats.totalTime.avg).toBeGreaterThan(0);

    expect(result.stats.requestsPerSecond).toBeGreaterThan(0);
  });

  it('deve lidar com timeouts corretamente', async () => {
    // Arrange
    const targetUrl = 'http://timeout-test.com';
    const numRequests = 2;
    const timeout = 100; // 100ms

    nock(targetUrl).get('/').times(numRequests).delay(200).reply(200, 'OK'); // Atraso maior que o timeout

    // Act
    const result = await useCase.execute('int-test-timeout', `${targetUrl}/`, numRequests, 1, 'GET', undefined, undefined, timeout);

    // Assert
    expect(result.requests).toBe(numRequests);
    expect(result.stats.successCount).toBe(0);
    expect(result.stats.failedCount).toBe(numRequests);
    // Verifica se o status do resultado reflete o timeout
    result.result.forEach(res => {
      expect(res.codeStatus).toBe(408);
    });
  });
});
