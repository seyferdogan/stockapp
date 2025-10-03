import { supabase } from './supabase'
import { User, StockItem, WarehouseInventory, StockRequestSubmission } from '@/types/stock'

// User Management
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Convert snake_case to camelCase
    return (data || []).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeLocation: user.store_location,
      createdAt: user.created_at
    }))
    
  } catch (err) {
    console.error('Error fetching users:', err)
    return []
  }
}

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  // Convert camelCase to snake_case for database
  const dbUserData = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    store_location: userData.storeLocation
  }

  const { data, error } = await supabase
    .from('users')
    .insert([dbUserData])
    .select()
    .single()

  if (error) throw error
  
  // Convert back to camelCase
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    storeLocation: data.store_location,
    createdAt: data.created_at
  }
}

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  // Convert camelCase to snake_case for database
  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.storeLocation !== undefined) dbUpdates.store_location = updates.storeLocation

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  
  // Convert back to camelCase
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    storeLocation: data.store_location,
    createdAt: data.created_at
  }
}

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
}

// Stock Items Management
export const getStockItems = async (): Promise<StockItem[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching stock items:', error)
      return []
    }

    return data || []
    
  } catch (err) {
    console.error('Error fetching stock items:', err)
    return []
  }
}

export const createStockItem = async (item: Omit<StockItem, 'id'>): Promise<StockItem> => {
  const { data, error } = await supabase
    .from('stock_items')
    .insert([item])
    .select()
    .single()

  if (error) throw error
  return data
}

// Warehouse Inventory Management
export const getWarehouseInventory = async (): Promise<WarehouseInventory[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_inventory')
      .select('*')

    if (error) {
      console.error('Error fetching inventory:', error)
      return []
    }
    
    // Convert snake_case to camelCase
    return (data || []).map(inventory => ({
      itemId: inventory.item_id,
      availableQuantity: inventory.available_quantity
    }))
    
  } catch (err) {
    console.error('Error fetching inventory:', err)
    return []
  }
}

export const addStock = async (itemId: string, quantity: number): Promise<void> => {
  // First check if inventory record exists
  const { data: existingInventory, error: checkError } = await supabase
    .from('warehouse_inventory')
    .select('*')
    .eq('item_id', itemId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw checkError
  }

  if (existingInventory) {
    // Update existing inventory
    const { error } = await supabase
      .from('warehouse_inventory')
      .update({ 
        available_quantity: existingInventory.available_quantity + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('item_id', itemId)

    if (error) throw error
  } else {
    // Create new inventory record
    const { error } = await supabase
      .from('warehouse_inventory')
      .insert([{
        item_id: itemId,
        available_quantity: quantity
      }])

    if (error) throw error
  }
}

export const createNewProduct = async (
  product: Omit<StockItem, 'id'>, 
  initialQuantity: number
): Promise<void> => {
  // First create the stock item
  const { data: stockItem, error: stockError } = await supabase
    .from('stock_items')
    .insert([product])
    .select()
    .single()

  if (stockError) throw stockError

  // Then create the inventory entry
  const { error: inventoryError } = await supabase
    .from('warehouse_inventory')
    .insert([{
      item_id: stockItem.id,
      available_quantity: initialQuantity
    }])

  if (inventoryError) throw inventoryError
}

export const deleteProduct = async (itemId: string): Promise<void> => {
  // First delete from warehouse_inventory (this will cascade due to foreign key)
  const { error: inventoryError } = await supabase
    .from('warehouse_inventory')
    .delete()
    .eq('item_id', itemId)

  if (inventoryError) throw inventoryError

  // Then delete the stock item (this will also cascade to stock_request_items)
  const { error: stockError } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', itemId)

  if (stockError) throw stockError
}

export const deleteStockRequest = async (requestId: string): Promise<void> => {
  // First delete the request items
  const { error: itemsError } = await supabase
    .from('stock_request_items')
    .delete()
    .eq('request_id', requestId)

  if (itemsError) throw itemsError

  // Then delete the main request
  const { error: requestError } = await supabase
    .from('stock_requests')
    .delete()
    .eq('id', requestId)

  if (requestError) throw requestError
}

// Stock Requests Management
export const getStockRequests = async (): Promise<StockRequestSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_requests')
      .select(`
        *,
        stock_request_items (
          item_id,
          requested_quantity
        )
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching stock requests:', error)
      return []
    }

    // Transform the data to match our interface
    return (data || []).map(request => ({
      id: request.id,
      requestNumber: request.request_number,
      storeLocation: request.store_location,
      items: request.stock_request_items.map((item: any) => ({
        itemId: item.item_id,
        requestedQuantity: item.requested_quantity
      })),
      comments: request.comments || '',
      status: request.status,
      submittedAt: request.submitted_at,
      processedAt: request.processed_at,
      shippedAt: request.shipped_at
    }))
    
  } catch (err) {
    console.error('Error fetching stock requests:', err)
    return []
  }
}

export const createStockRequest = async (request: Omit<StockRequestSubmission, 'id'>): Promise<void> => {
  // First create the main request (request_number will auto-increment)
  const { data: stockRequest, error: requestError } = await supabase
    .from('stock_requests')
    .insert([{
      store_location: request.storeLocation,
      comments: request.comments,
      status: request.status,
      submitted_at: request.submittedAt
    }])
    .select()
    .single()

  if (requestError) throw requestError

  // Then create the request items
  const requestItems = request.items.map(item => ({
    request_id: stockRequest.id,
    item_id: item.itemId,
    requested_quantity: item.requestedQuantity
  }))

  const { error: itemsError } = await supabase
    .from('stock_request_items')
    .insert(requestItems)

  if (itemsError) throw itemsError
}

export const updateRequestStatus = async (
  requestId: string, 
  status: 'pending' | 'accepted' | 'shipped'
): Promise<void> => {
  const updates: any = { status }
  
  if (status === 'accepted') {
    updates.processed_at = new Date().toISOString()
  } else if (status === 'shipped') {
    updates.shipped_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('stock_requests')
    .update(updates)
    .eq('id', requestId)

  if (error) throw error

  // If accepting request, decrease inventory
  if (status === 'accepted') {
    // Get the request items to decrease inventory
    const { data: requestItems, error: itemsError } = await supabase
      .from('stock_request_items')
      .select('item_id, requested_quantity')
      .eq('request_id', requestId)

    if (itemsError) throw itemsError

    // Decrease inventory for each item
    for (const item of requestItems || []) {
      const { data: currentInventory, error: invError } = await supabase
        .from('warehouse_inventory')
        .select('available_quantity')
        .eq('item_id', item.item_id)
        .single()

      if (invError) throw invError

      const newQuantity = Math.max(0, currentInventory.available_quantity - item.requested_quantity)
      
      const { error: updateError } = await supabase
        .from('warehouse_inventory')
        .update({ 
          available_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('item_id', item.item_id)

      if (updateError) throw updateError
    }
  }
}
