import { NextRequest, NextResponse } from 'next/server';
import { getStockItems, createStockItem } from '@/lib/database';

export async function GET() {
  try {
    const items = await getStockItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json({ error: 'Failed to fetch stock items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();
    const item = await createStockItem(itemData);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Failed to create stock item' }, { status: 500 });
  }
}
