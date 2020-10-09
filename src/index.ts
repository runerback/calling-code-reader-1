import { CalingCodeModel, Config } from './module';
import request from './request';
import matches from './matches';
import fs from 'fs';
import path from 'path';
import { Pattern } from './patterns';

const _config = readConfig();

read(_config)
    .then((data: CalingCodeModel[]) => {
        fs.writeFileSync(
            _config.output,
            JSON.stringify(data, null, '  ')
        );
        console.log('done');
    })
    .catch((error: Error) => console.error(error));

function readConfig(): Config {
    const { rootURL, cachePath, output } = (<Config>JSON.parse(fs.readFileSync(
        path.resolve('./config.json'),
        'utf-8')));

    const safeCachePath = path.resolve(cachePath);
    if (!fs.existsSync(safeCachePath)) {
        fs.mkdirSync(safeCachePath);
    }

    return {
        rootURL: rootURL,
        cachePath: safeCachePath,
        output: path.resolve(output)
    };
}

async function read(config: Config): Promise<CalingCodeModel[]> {
    const rootHtml = await request(config.rootURL, config);

    const keySet = new Set<string>();

    return [...iterator(rootHtml, config)].filter(it => {
        const key = `${it.code2}${it.code3}`;
        if (keySet.has(key)) {
            return false;
        }

        keySet.add(key);
        return true;
    });
}

function* iterator(html: string, config: Config): IterableIterator<CalingCodeModel> {
    for (const group of matches(Pattern, ['g', 's'], html)) {
        yield {
            code2: group['code2'].valueOf(),
            code3: group['code3'].valueOf(),
            code: group['code'].valueOf()
        }
    };
}