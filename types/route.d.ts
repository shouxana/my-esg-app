// types/route.d.ts
import { NextRequest, NextResponse } from 'next/server';

declare module 'next/server' {
  interface RouteParams {
    id: string;
  }

  interface RouteContext {
    params: RouteParams;
  }

  export function PUT(
    request: NextRequest,
    context: { params: RouteParams }
  ): Promise<NextResponse>;
}