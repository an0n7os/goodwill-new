import AdminPageHeader from './AdminPageHeader';
import {getWebsiteTools} from '@/lib/websiteActions';
import {requireAdmin} from '@/lib/adminGuard';
import {redirect} from 'next/navigation';
import WebsiteClient from '@/app/admin/website/WebsiteClient';
export default async function BusinessWorkspacePage({title,description,section}:{title:string;description:string;section:string}){let actor;try{actor=await requireAdmin();}catch{redirect('/admin/login');}const allowed=section==='Quotations'?['owner','manager']:['owner'];if(!allowed.includes(actor.role))return <div className="p-6">This section is available to {section==='Quotations'?'the owner or manager':'the owner'}.</div>;const data=await getWebsiteTools();return <div className="space-y-6"><AdminPageHeader title={title} description={description}/><WebsiteClient data={data} initialSection={section}/></div>;}
