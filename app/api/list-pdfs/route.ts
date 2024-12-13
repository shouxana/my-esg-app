import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get company and section from query parameters
    const company = request.nextUrl.searchParams.get('company');
    const section = request.nextUrl.searchParams.get('section');

    if (!company) {
      return NextResponse.json({ error: 'Company parameter required' }, { status: 400 });
    }

    if (!section || !['environmental', 'social', 'governance'].includes(section)) {
      return NextResponse.json({ error: 'Valid section parameter required' }, { status: 400 });
    }

    const sanitizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
    // Construct the prefix to include both the section and company
    const prefix = `${section}/${sanitizedCompany}/`;

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    
    const pdfs = await Promise.all(
      response.Contents?.map(async (item) => {
        const getObjectCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: item.Key!,
        });
        
        const url = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600,
        });

        return {
          id: item.Key!,
          name: item.Key!.split('/').pop()!,
          uploadDate: item.LastModified?.toLocaleDateString(),
          size: `${(item.Size! / 1024 / 1024).toFixed(2)} MB`,
          url: url,
        };
      }) || []
    );

    return NextResponse.json(pdfs);
  } catch (error) {
    console.error('Error listing PDFs:', error);
    return NextResponse.json(
      { error: 'Error listing PDFs' },
      { status: 500 }
    );
  }
}