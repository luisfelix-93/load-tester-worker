import { LoadTestProcessor } from '../src/infrastructure/jobs/loadTest.processor';
import { ILoadData } from '../src/infrastructure/types/ILoadData';
import { Job, Queue } from 'bullmq';

describe('LoadTestProcessor Integration Test', () => {
    let mockResultsQueue: jest.Mocked<Queue>;
    let loadTestProcessor: LoadTestProcessor;

    beforeEach(() => {
        mockResultsQueue = {
            add: jest.fn().mockResolvedValue(undefined),
        } as any;
        loadTestProcessor = new LoadTestProcessor(mockResultsQueue);
    });

    it('deve processar um job, disparar um worker e adicionar o resultado na fila de resultados', async () => {
        // Arrange: Define um job de teste com timeouts generosos para evitar instabilidade.
        const jobData: ILoadData = {
            testId: 'integration-test-01',
            targetUrl: 'https://httpbin.org/get', // Um serviço externo rápido e confiável.
            numRequests: 5,
            concurrency: 2,
            method: 'GET',
            timeout: 15000, // Timeout de 15s por requisição.
        };
        const job = { id: 'job-01', data: jobData } as Job<ILoadData>;

        // Act: Processa o job, disparando um worker thread real.
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
    }, 30000); // Timeout de 30s para o teste completo.
});
