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
        // Limpa a variável de ambiente após cada teste
        delete process.env.USE_MOCK_MAKE_REQUEST;
    });

    afterEach(() => {
        // Garante que a variável de ambiente seja limpa
        delete process.env.USE_MOCK_MAKE_REQUEST;
    });

    it('deve processar um job, disparar um worker e adicionar o resultado na fila de resultados', async () => {
        // Arrange: Ativa o mock para este teste
        process.env.USE_MOCK_MAKE_REQUEST = 'true';

        // Arrange: Define um job de teste (a URL não importa mais)
        const jobData: ILoadData = {
            testId: 'integration-test-01',
            targetUrl: 'https://www.httpstatus.com.br/200/',
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
    }, 10000);
});
