import { NextResponse } from 'next/server';

let healthInfoData = [];

export async function GET() {
  return NextResponse.json(healthInfoData);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.title || !body.content) {
    return NextResponse.json({ message: 'กรุณากรอก title และ content' }, { status: 400 });
  }

  const newItem = {
    id: String(Date.now()),
    title: body.title,
    content: body.content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  healthInfoData.push(newItem);

  return NextResponse.json(newItem, { status: 201 });
}
