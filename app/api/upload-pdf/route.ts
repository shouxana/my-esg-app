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
    // Parse form data
    const formData = await request.formData();

    // Extract form data fields
    const file = formData.get('file') as File;
    const company = formData.get('company') as string;
    const section = formData.get('section') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!company) {
      return NextResponse.json({ error: 'Company information required' }, { status: 400 });
    }
    if (!section) {
      return NextResponse.json({ error: 'Section information required' }, { status: 400 });
    }

    // Validate section value
    const validSections = ['environmental', 'social', 'governance'];
    const normalizedSection = section.toLowerCase();
    
    if (!validSections.includes(normalizedSection)) {
      return NextResponse.json({ 
        error: `Invalid section specified. Must be one of: ${validSections.join(', ')}` 
      }, { status: 400 });
    }

    // Process file
    const buffer = await file.arrayBuffer();
    const fileName = file.name.replace(/\s+/g, '-');
    const timestamp = Date.now();
    const fileKey = `pdfs/test1/${normalizedSection}/${timestamp}-${fileName}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
        Body: Buffer.from(buffer),
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
        Metadata: {
          'original-filename': fileName,
          'company': company,
          'section': normalizedSection,
          'upload-timestamp': timestamp.toString()
        },
        CacheControl: 'no-cache'
      })
    );

    // Generate signed URL
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: 'inline'
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      id: fileKey,
      url: signedUrl,
      name: fileName,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadDate: new Date().toLocaleDateString(),
      section: normalizedSection
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error uploading file',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}