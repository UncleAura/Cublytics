import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Replit Node.js backend is working!", 
    wca_id: "2015KLEM01" 
  });
}