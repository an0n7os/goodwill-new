export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.GOODWILL_AUTO_BACKUP==='1'){
  const {dailyBackup}=await import('./lib/business/backup');
  const work=()=>dailyBackup().catch(error=>console.error('Automatic backup failed:',error instanceof Error?error.message:'Unknown error'));
  await work();setInterval(work,60*60*1000).unref();
  const {expireUnpaidPayments}=await import("./lib/business/payments");
  setInterval(()=>{void expireUnpaidPayments().catch(()=>{});},60000).unref();
  const {drainNotifications}=await import("./lib/business/notifications");
  setInterval(()=>{void drainNotifications().catch(()=>{});},60000).unref();
 }
}
