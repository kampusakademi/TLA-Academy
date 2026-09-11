import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
const CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID;
const CUSTOMER_CERTIFICATE = process.env.AGORA_CUSTOMER_CERTIFICATE;

export async function POST(request: Request) {
  try {
    const { channelName, action } = await request.json();

    if (!channelName) return NextResponse.json({ error: 'Kanal adı gereklidir.' }, { status: 400 });
    
    // Şifrelerin var olup olmadığını kontrol ediyoruz
    if (!CUSTOMER_ID || !CUSTOMER_CERTIFICATE) {
      console.error("REST API Şifreleri .env.local dosyasında bulunamadı!");
      return NextResponse.json({ error: 'REST API şifreleri eksik.' }, { status: 500 });
    }

    // DÜZELTME: API Yetkilendirmesi için APP_ID değil, CUSTOMER_ID kullanılmalı
    const credentials = Buffer.from(`${CUSTOMER_ID}:${CUSTOMER_CERTIFICATE}`).toString('base64');
    const agoraHost = `api.agora.io`;

    if (action === 'start') {
      const acquireRes = await httpsRequest(
        agoraHost,
        `/v1/apps/${APP_ID}/cloud_recording/acquire`, 
        'POST',
        credentials,
        {
          cname: channelName,
          uid: '999999',
          clientRequest: { resourceExpiredHour: 24 },
        }
      );

      if (!acquireRes.resourceId) {
        console.error("Acquire Başarısız:", acquireRes);
        return NextResponse.json({ error: 'Agora Resource ID alınamadı', details: acquireRes }, { status: 500 });
      }

      const resourceId = acquireRes.resourceId;

      const startRes = await httpsRequest(
        agoraHost,
        `/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
        'POST',
        credentials,
        {
          cname: channelName,
          uid: '999999',
          clientRequest: {
            recordingConfig: {
              maxIdleTime: 30,
              streamTypes: 2,
              channelType: 0,
              videoStreamType: 0,
              transcodingConfig: { width: 1280, height: 720, fps: 30, bitrate: 1000, mixedVideoLayout: 1 },
            },
            storageConfig: {
              vendor: 6,
              region: 14,
              bucket: process.env.SUPABASE_S3_BUCKET || 'ders-kayitlari',
              accessKey: process.env.SUPABASE_S3_ACCESS_KEY || '',
              secretKey: process.env.SUPABASE_S3_SECRET_KEY || '',
              fileNamePrefix: [channelName, 'cloud-kayit'],
            },
          },
        }
      );

      if (startRes.sid) {
        const expectedFilePath = `${channelName}/cloud-kayit/${startRes.sid}_${channelName}.m3u8`;
        const { data: dersData } = await supabaseAdmin.from('dersler').select('kayit_url').eq('id', channelName).maybeSingle();
        const existingUrls = dersData?.kayit_url ? `${dersData.kayit_url},${expectedFilePath}` : expectedFilePath;
        await supabaseAdmin.from('dersler').update({ kayit_url: existingUrls }).eq('id', channelName);
      }

      return NextResponse.json({ success: true, sid: startRes.sid, resourceId });
    }

    return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  } catch (error: any) {
    console.error('Cloud Recording API Hatası:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

function httpsRequest(host: string, path: string, method: string, auth: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const dataString = JSON.stringify(data);
    const options = {
      hostname: host, port: 443, path: path, method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(dataString),
      },
    };
    const req = https.request(options, (res: any) => {
      let responseBody = '';
      res.on('data', (chunk: any) => { responseBody += chunk; });
      res.on('end', () => {
         try { resolve(JSON.parse(responseBody || '{}')); } 
         catch(e) { resolve({ raw: responseBody }); }
      });
    });
    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}