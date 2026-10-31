import {spawn,spawnSync} from 'node:child_process';import path from 'node:path';import fs from 'node:fs';
const mode=process.argv[2]||'start';const file=path.resolve('imports/workflow-schema-check.db');
if(!fs.existsSync(file))throw Error('Reviewed test database is missing. Do not use the real database.');
const workspace=process.cwd(),runtime=path.resolve('.workflow-preview');
fs.mkdirSync(path.join(runtime,'imports'),{recursive:true});
const lock=path.join(runtime,'.workflow-task.lock');
if(fs.existsSync(lock)){try{const previous=JSON.parse(fs.readFileSync(lock,'utf8'));process.kill(previous.pid,0);throw Error('Another test build/check is still running. Wait for it to finish.');}catch(e){if(e.code==='ESRCH')fs.unlinkSync(lock);else throw e;}}
if(mode!=='start')fs.writeFileSync(lock,JSON.stringify({pid:process.pid,mode}),{flag:'wx'});
const unlock=()=>{if(mode!=='start'&&fs.existsSync(lock))fs.unlinkSync(lock);};process.on('exit',unlock);
if(!fs.existsSync(path.join(runtime,'node_modules/next/package.json')))throw Error('Install the isolated patched runtime first: npm install --prefix .workflow-preview --ignore-scripts');
if(mode!=='start'){
 for(const dir of ['src','prisma','tests','scripts'])fs.cpSync(path.join(workspace,dir),path.join(runtime,dir),{recursive:true});
 for(const name of ['next.config.ts','tsconfig.json','prisma.config.ts','eslint.config.mjs','.env'])if(fs.existsSync(name))fs.copyFileSync(name,path.join(runtime,name));
 for(const name of ['public','.media','.backups','.recovery']){fs.mkdirSync(path.join(workspace,name),{recursive:true});if(!fs.existsSync(path.join(runtime,name)))fs.symlinkSync(path.join(workspace,name),path.join(runtime,name),'junction');}
}
const env={...process.env,DATABASE_URL:'file:'+file.replaceAll('\\','/'),DIRECT_URL:'file:'+file.replaceAll('\\','/'),BETTER_AUTH_URL:'http://localhost:3031',GOODWILL_BUILD_DIR:'.next-workflow-test',GOODWILL_WORKFLOW_TEST:'1',GOODWILL_AUTO_BACKUP:mode==='start'?'1':'0',PORT:'3031'};
if(mode==='test'){const disposable=path.resolve('imports/workflow-integration.db');fs.copyFileSync(file,disposable);env.DATABASE_URL='file:'+disposable.replaceAll('\\','/');env.DIRECT_URL=env.DATABASE_URL;}
if(mode!=='start'){const generated=spawnSync(process.execPath,['node_modules/prisma/build/index.js','generate'],{stdio:'inherit',env,cwd:runtime});if(generated.status)process.exit(generated.status);}
const args=mode==='build'?['node_modules/next/dist/bin/next','build','--webpack']:mode==='start'?['node_modules/next/dist/bin/next','start','--port','3031']:mode==='seed'?['node_modules/tsx/dist/cli.mjs','scripts/seed-workflow-test.ts']:mode==='test'?['node_modules/tsx/dist/cli.mjs','--test','--test-concurrency=1','tests/business-workflow.test.ts','tests/checkout.test.ts','tests/website-workflow.test.ts']:null;
if(!args)throw Error('Use seed, build, start or test');
const child=spawn(process.execPath,args,{stdio:'inherit',env,cwd:runtime});child.on('exit',code=>process.exit(code??1));
