import { Queue } from "bullmq";

const q = new Queue('load-tester-jobs', {
    connection: {
        host: 'localhost',
        port: 6379
    }
});

async function addTestJob() {
    await q.add('load-test-job', {
        targetUrl: 'http://localhost:3000/health-check',
        numRequests: 100,
        concurrency: 10
    })

    console.log('Jobs de teste adicionados!');

    process.exit();
}

addTestJob();