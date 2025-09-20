import { LoadTestProcessor } from '../src/infrastructure/jobs/loadTest.processor';
import { ILoadData } from '../src/infrastructure/types/ILoadData';
import { Job, Queue } from 'bullmq';
import { makeRequest } from '../src/utils/makeRequest';

// Mocka o módulo que faz a requisição HTTP. Todas as chamadas para makeRequest
// serão interceptadas e usarão nossa implementação falsa.
jest.mock('../src/utils/makeRequest');

describe('LoadTestProcessor Integration Test', () => {
    let mockResultsQueue: jest.Mocked<Queue>;
    let loadTestProcessor: LoadTestProcessor;

    beforeEach(() => {
        // Limpa os mocks antes de cada teste
        (makeRequest as jest.Mock).mockClear();

        mockResultsQueue = {
            add: jest.fn().mockResolvedValue(undefined),
        } as any;
        loadTestProcessor = new LoadTestProcessor(mockResultsQueue);
    });

    it('deve processar um job, disparar um worker e adicionar o resultado na fila de resultados', async () => {
        // Arrange: Define uma implementação de sucesso para o nosso makeRequest mockado
        (makeRequest as jest.Mock).mockResolvedValue({
            status: 'OK',
            codeStatus: 200,
            responseTime: 50, // Resposta rápida e simulada
            timeToFirstByte: 49,
            timeToLastByte: 1,
        });

        // Arrange: Define um job de teste (a URL não importa mais)
        const jobData: ILoadData = {
            testId: 'integration-test-01',
            targetUrl: 'http://any.url.com',
            numRequests: 5,
            concurrency: 2,
            method: 'GET',
            timeout: 1000,
        };
        const job = { id: 'job-01', data: jobData } as Job<ILoadData>;

        // Act: Processa o job.
        await loadTestProcessor.loadTestProcessor(job);

        // Assert: Verifica se a fila de resultados recebeu os dados corretos.
        expect(mockResultsQueue.add).toHaveBeenCalledTimes(1);
        expect(mockResultsQueue.add).toHaveBeenCalledWith(
            'result',
            expect.objectContaining({
                testId: 'integration-test-01',
                requests: 5,
                stats: expect.objectContaining({
                    successCount: 5,
                    failedCount: 0
                })
            })
        );

        // Assert: Garante que nossa função de requisição foi chamada 5 vezes.
        expect(makeRequest).toHaveBeenCalledTimes(5);
    }, 10000);
});
