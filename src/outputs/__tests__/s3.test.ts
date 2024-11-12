import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { S3 } from '../s3';
import { Client } from 'minio';

vi.mock('minio');

describe('S3 Output', () => {
    let s3: S3;
    let config: any;

    beforeEach(() => {
        config = {
            bucket: 'test-bucket',
            partition: 'test-partition',
            spoolSize: 1024,
            flushInterval: 1000,
            s3config: {
                endPoint: 'localhost',
                port: 9000,
                useSSL: false,
                accessKey: 'accessKey',
                secretKey: 'secretKey',
            },
        };

        s3 = new S3(config);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize minio client with given config', () => {
        expect(Client).toHaveBeenCalledWith(config.s3config);
    });

    it('should resolve partition correctly', () => {
        const event = { id: 1, message: 'test' };
        const partition = s3.resolvePartition(event);
        expect(partition).toBe('test-partition');
    });

    it('should write events to the correct buffer', () => {
        const event = { id: 1, message: 'test' };
        s3.write(event, 'utf-8', () => {});
        expect(s3['buffers']['test-partition']).toBeDefined();
    });

    it('should flush all buffers', () => {
        const flushMock = vi.fn();
        s3['buffers']['test-partition'] = { flush: flushMock } as any;
        s3.flushAllBuffers();
        expect(flushMock).toHaveBeenCalled();
    });

    it('should call client.putObject when buffer flushes', async () => {
        const event = { id: 1, message: 'test' };
        const putObjectMock = vi.fn().mockResolvedValue({});
        s3['client']['putObject'] = putObjectMock;
        s3.write(event, 'utf-8', () => {});
        s3['buffers']['test-partition'].flush(() => {});
        expect(putObjectMock).toHaveBeenCalled();
        expect(putObjectMock).toHaveBeenCalledWith('test-bucket', 'test-partition', s3['buffers']['test-partition']);
    });
});

describe('S3 Partition', () => {
    const s3 = new S3({
        bucket: 'test-bucket',
        partition: 'test/${new Date(event.time).getDate()}',
        spoolSize: 1024,
        flushInterval: 1000,
        s3config: {
            endPoint: 'localhost',
            port: 9000,
            useSSL: false,
            accessKey: 'accessKey',
            secretKey: 'secretKey',
        },
    })

    it('should resolve partition correctly', () => {
        const event = { time: new Date(), message: 'test' };
        const partition = s3.resolvePartition(event);
        expect(partition).toBe(`test/${new Date(event.time).getDate().toString()}`);
    });
})
