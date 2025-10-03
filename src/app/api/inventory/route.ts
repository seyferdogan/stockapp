import { NextRequest, NextResponse } from 'next/server';
import { getWarehouseInventory, addStock, createNewProduct, deleteProduct } from '@/lib/database';

export async function GET() {
  try {
    const inventory = await getWarehouseInventory();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    switch (action) {
      case 'addStock':
        await addStock(data.itemId, data.quantity);
        break;
      case 'createProduct':
        await createNewProduct(data.product, data.initialQuantity);
        break;
      case 'deleteProduct':
        await deleteProduct(data.itemId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing inventory action:', error);
    return NextResponse.json({ error: 'Failed to process inventory action' }, { status: 500 });
  }
}
