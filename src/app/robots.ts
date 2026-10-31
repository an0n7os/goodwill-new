import type {MetadataRoute} from 'next';import {siteUrl,testSite} from '@/lib/site';
export default function robots():MetadataRoute.Robots{return testSite()?{rules:{userAgent:'*',disallow:'/'}}:{rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/','/account','/checkout','/cart','/recover','/quote/','/track-order']},sitemap:siteUrl()+'/sitemap.xml'};}
