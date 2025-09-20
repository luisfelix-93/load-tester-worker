import { workerData, parentPort } from 'worker_threads';
import { RunLoadTestUseCase } from '../../services/runLoadTest.usecase';
import { ILoadData } from '../types/ILoadData';

if (!parentPort) {
  throw new Error('This script must be run as a worker thread.');
}

const runTest = async () => {
  try {
    const {
        testId,
        targetUrl,
        numRequests,
        concurrency,
        method,
        payload,
        headers,
        timeout
    } = workerData as ILoadData;

    // Garante valores padrão para as propriedades opcionais
    const executionMethod = method ?? 'GET';
    const executionHeaders = headers ?? {};
    const executionPayload = payload ?? null;
    const executionTimeout = timeout ?? 10000;

    const runLoadTestUseCase = new RunLoadTestUseCase();
    const result = await runLoadTestUseCase.execute(
        testId,
        targetUrl,
        numRequests,
        concurrency,
        executionMethod,
        executionPayload,
        executionHeaders,
        executionTimeout
    );
    
    parentPort!.postMessage({ success: true, data: result });
  } catch (error: any) {
    parentPort!.postMessage({ success: false, error: error.message });
  } finally {
    process.exit(0);
  }
};

runTest();