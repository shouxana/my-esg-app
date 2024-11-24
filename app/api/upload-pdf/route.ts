import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const company = formData.get('company') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!company) {
      return NextResponse.json({ error: 'Company information required' }, { status: 400 });
    }

    // Sanitize company name for use in folder path (remove special chars, spaces, etc)
    const sanitizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const buffer = await file.arrayBuffer();
    // Include company name in the file path
    const fileKey = `pdfs/${sanitizedCompany}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    // Upload to S3 with proper headers
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
        Body: Buffer.from(buffer),
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
        Metadata: {
          'original-filename': file.name,
          'company': sanitizedCompany
        },
        CacheControl: 'no-cache'
      })
    );

    // Generate a signed URL with specific parameters
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: 'inline'
      }),
      { 
        expiresIn: 3600
      }
    );

    return NextResponse.json({
      id: fileKey,
      url: url,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}