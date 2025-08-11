import { RunLoadTestUseCase } from '../src/services/runLoadTest.usecase';
import * as makeRequestModule from '../src/utils/makeRequest';
import * as calcStatsModule from '../src/utils/calcStats';

// Mock das dependências
jest.mock('../src/utils/makeRequest');
jest.mock('../src/utils/calcStats');

describe('RunLoadTestUseCase - Unit', () => {
  let useCase: RunLoadTestUseCase;
  const makeRequestMock = makeRequestModule.makeRequest as jest.Mock;
  const calcStatsMock = calcStatsModule.calcStats as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RunLoadTestUseCase();
  });

  it('deve executar o teste de carga e retornar as estatísticas corretas', async () => {
    // Arrange
    const testId = 'unit-test-1';
    const targetUrl = 'http://test.com';
    const numRequests = 10;
    const concurrency = 2;

    // Mock para makeRequest retornando sucesso
    makeRequestMock.mockResolvedValue({
      codeStatus: 200,
      responseTime: 100, // 100ms
      status: 'OK',
      timeToFirstByte: 20,
      timeToLastByte: 80,
    });

    // Mock para calcStats
    const fakeStats = { min: 0.1, max: 0.1, avg: 0.1 };
    calcStatsMock.mockReturnValue(fakeStats);

    // Act
    const result = await useCase.execute(testId, targetUrl, numRequests, concurrency);

    // Assert
    expect(result.testId).toBe(testId);
    expect(result.requests).toBe(numRequests);
    expect(result.concurrency).toBe(concurrency);
    expect(result.result.length).toBe(numRequests);

    // Verifica se makeRequest foi chamado o número correto de vezes
    expect(makeRequestMock).toHaveBeenCalledTimes(numRequests);
    expect(makeRequestMock).toHaveBeenCalledWith(targetUrl, {
      method: 'GET',
      headers: undefined,
      payload: undefined,
      timeout: undefined,
    });

    // Verifica se calcStats foi chamado para os 3 tipos de métricas
    expect(calcStatsMock).toHaveBeenCalledTimes(3);
    expect(calcStatsMock).toHaveBeenCalledWith(expect.any(Array)); // totalTime
    expect(calcStatsMock).toHaveBeenCalledWith(expect.any(Array)); // timeToFirstByte
    expect(calcStatsMock).toHaveBeenCalledWith(expect.any(Array)); // timeToLastByte

    // Verifica as estatísticas
    expect(result.stats.successCount).toBe(numRequests);
    expect(result.stats.failedCount).toBe(0);
    expect(result.stats.totalTime).toEqual(fakeStats);
    expect(result.stats.timeToFirstByte).toEqual(fakeStats);
    expect(result.stats.timeToLastByte).toEqual(fakeStats);
  });

  it('deve contar falhas corretamente', async () => {
    // Arrange
    const numRequests = 5;
    makeRequestMock.mockResolvedValue({ codeStatus: 500, responseTime: 50, status: 'Error' });

    // Act
    const result = await useCase.execute('test-fail', 'http://fail.com', numRequests, 1);

    // Assert
    expect(makeRequestMock).toHaveBeenCalledTimes(numRequests);
    expect(result.stats.successCount).toBe(0);
    expect(result.stats.failedCount).toBe(numRequests);
  });
});
