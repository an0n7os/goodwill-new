import {spawn} from 'node:child_process';
const mode=process.argv[2];
if(!['build','start'].includes(mode))throw Error('Use build or start');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',mode,...(mode==='build'?['--webpack']:['--port',process.env.PORT||'3030'])],{stdio:'inherit',env:{...process.env,GOODWILL_BUILD_DIR:'.next-production'}});
child.on('exit',code=>process.exit(code??1));
