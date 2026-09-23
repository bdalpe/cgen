import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {S3, S3OutputConfig} from '../s3';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

vi.mock('@aws-sdk/client-s3');

describe('S3 Output', () => {
    let s3: S3;
    let config: S3OutputConfig;

    beforeEach(() => {
        config = {
            bucket: 'test-bucket',
            partition: 'test-partition',
            spoolSize: 1024,
            flushInterval: 1000,
            s3config: {
                endpoint: 'http://localhost:9000',
	            credentials: {
		            accessKeyId: 'accessKey',
		            secretAccessKey: 'secretKey',
	            }
            },
        };

        s3 = new S3(config);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize S3 client with given config', () => {
        expect(S3Client).toHaveBeenCalledWith(config.s3config);
    });

    it('should resolve partition correctly', () => {
        const event = { time: new Date(), event: 'test' };
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
        s3['buffers']['test-partition'] = { flush: flushMock } as never;
        s3.flushAllBuffers();
        expect(flushMock).toHaveBeenCalled();
    });

    it('should call client.send when buffer flushes', async () => {
        const event = { id: 1, message: 'test' };
        const putObjectMock = vi.fn().mockResolvedValue({});
        s3['client']['send'] = putObjectMock;
        s3.write(event, 'utf-8', () => {});
        s3['buffers']['test-partition'].flush(() => {});
        expect(putObjectMock).toHaveBeenCalled();
        expect(putObjectMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
});

describe('S3 Partition', () => {
    const s3 = new S3({
        bucket: 'test-bucket',
        partition: 'test/${new Date(event.time).getDate()}',
        spoolSize: 1024,
        flushInterval: 1000,
        s3config: {
            endpoint: 'http://localhost:9000',
	        credentials: {
		        accessKeyId: 'accessKey',
		        secretAccessKey: 'secretKey',
	        }            
        },
    })

    it('should resolve partition correctly', () => {
        const event = { time: new Date(), event: 'test' };
        const partition = s3.resolvePartition(event);
        expect(partition).toBe(`test/${new Date(event.time).getDate().toString()}`);
    });
})
