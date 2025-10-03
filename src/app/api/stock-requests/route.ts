import { NextRequest, NextResponse } from 'next/server';
import { getStockRequests, createStockRequest, updateRequestStatus, deleteStockRequest, updateStockRequest } from '@/lib/database';

export async function GET() {
  try {
    const requests = await getStockRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching stock requests:', error);
    return NextResponse.json({ error: 'Failed to fetch stock requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    switch (action) {
      case 'create':
        await createStockRequest(data.request);
        break;
      case 'update':
        await updateStockRequest(data.requestId, data.updates);
        break;
      case 'updateStatus':
        await updateRequestStatus(data.requestId, data.status, data.options);
        break;
      case 'delete':
        await deleteStockRequest(data.requestId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing stock request action:', error);
    return NextResponse.json({ error: 'Failed to process stock request action' }, { status: 500 });
  }
}
