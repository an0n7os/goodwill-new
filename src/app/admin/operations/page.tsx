import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {getOperations} from '@/lib/businessActions';
import OperationsClient from './OperationsClient';
export const revalidate=0;
export default async function OperationsPage({searchParams}:{searchParams:Promise<{tab?:string}>}){
 const [data,params]=await Promise.all([getOperations(),searchParams]);
 return <div className="flex flex-col gap-6"><AdminPageHeader title="Shop operations" description="Receive stock, record counter sales, deliver orders and reconcile cash."/><OperationsClient data={data} initialTab={params.tab}/></div>;
}
