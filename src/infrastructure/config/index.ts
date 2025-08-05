import dotenv from 'dotenv';
dotenv.config();

export const Config = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    queues: {
        loadTestJobs: 'load-tester-jobs',
        loadTestResults: 'load-tester-results', 
    }
}