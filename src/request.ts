import http, { ClientRequest, IncomingMessage } from 'http';
import https from 'https';
import { URL } from 'url';
import { Config } from './module';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface RequestResult {
    readonly data: string;
    readonly isBinary?: boolean;
    readonly failed?: boolean;
}

const get = (url: URL, callback: (response: IncomingMessage) => void): ClientRequest => {
    switch (url.protocol) {
        case 'http:':
            return http.get(url, {}, callback);
        case 'https:':
            return https.get(url, {}, callback);
        default:
            const request = new ClientRequest(url);
            request.abort();
            return request;
    }
};

const requestOnce = async (url: URL): Promise<RequestResult> => {
    return await new Promise(resolve => {
        get(url, res => {
            const isBinaryType = /image/.test(res.headers['content-type'] ?? '');
            if (isBinaryType) {
                res.setEncoding('binary');
            }

            let data = '';

            res.on('data', (trunk: String) => {
                data += trunk;
            })

            res.on('end', () => {
                resolve({
                    data: data,
                    isBinary: isBinaryType
                });
            });
        }).on('error', (error: Error) => {
            console.error(error);
            resolve({
                data: '',
                failed: true
            });
        })
    });
};

const tryRequest = async (url: URL, retryCount: number): Promise<RequestResult> => {
    for (let i = 0; i < retryCount;) {
        try {
            return await requestOnce(url);
        } catch {
            if (++i < retryCount) {
                continue;
            }
        }
    }

    return {
        data: '',
        failed: true
    };
}

const getCacheKey = (url: URL): string => {
    const md5 = crypto.createHash('md5');

    md5.update(url.toString());

    const digest = md5.digest('hex');

    return `cache_${digest}.dat`;
};

const getCache = (url: URL, config: Config): string => {
    const key = getCacheKey(url);
    const cacheFile = path.join(config.cachePath, key);

    if (!fs.existsSync(cacheFile)) {
        return '';
    }

    return fs.readFileSync(cacheFile, 'utf-8');
};

const setCache = (url: URL, content: string, config: Config) => {
    const key = getCacheKey(url);
    const cacheFile = path.join(config.cachePath, key);

    fs.writeFileSync(cacheFile, content);
};

export default async function request(uri: string, config: Config, retry: number = 3): Promise<string> {
    let url: URL;
    try {
        url = new URL(uri);
    } catch (error) {
        console.error(error);
        return '';
    }

    console.log(`requesting [${url.toString()}] . . .`);

    const cached = getCache(url, config);
    if (cached) {
        console.log('loaded from cache');
        return cached;
    }

    const wait = Math.floor(Math.random() * Math.floor(3) + 1); // wait for 1 to 10 seconds
    console.log(`waiting for ${wait} seconds . . .`)
    await new Promise(resolve => {
        global.setTimeout(
            () => resolve(),
            wait * 1000
        );
    });

    const response = await tryRequest(url, retry);
    if (response.failed) {
        return '';
    }

    const data = response.isBinary
        ? Buffer.from(response.data).toString('base64')
        : response.data;

    setCache(url, data, config);
    console.log('cached');

    return data;
}