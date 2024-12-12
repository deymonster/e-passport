import { NextResponse, NextRequest } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';



export const PATCH = withAdminAuth(async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      console.error('Invalid passport ID:', params.id);
      return NextResponse.json({ error: 'Invalid passport ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Update passport request body:', body);
    
    const {
      sn,
      orderNumber,
      name,
      registryRecordId,
      type,
      productionDate,
      warrantyPeriod,
      documentIds,
    } = body;

    // Удаляем registryRecordId и batchId из данных паспорта
    const updateData = {
      sn,
      orderNumber,
      name,
      type,
      productionDate: productionDate ? new Date(productionDate) : undefined,
      warrantyPeriod,
      registryRecordId,
      documentIds

    };

    const passport = await repositories.passport.updatePassport(id, updateData);

    if (!passport) {
      console.error('Passport not found with ID:', id);
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    console.log('Successfully updated passport:', passport);
    return NextResponse.json(passport, { status: 200 });
  } catch (error) {
    console.error('Error updating passport:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
});

export const DELETE = withAdminAuth(async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      console.error('Invalid passport ID:', params.id);
      return NextResponse.json({ error: 'Invalid passport ID' }, { status: 400 });
    }

    console.log('Deleting passport with ID:', id);
    
    const deletedPassport = await repositories.passport.deletePassport(id);
    
    if (!deletedPassport) {
      console.error('Passport not found with ID:', id);
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    console.log('Successfully deleted passport:', deletedPassport);
    return NextResponse.json(deletedPassport, { status: 200 });
  } catch (error) {
    console.error('Error deleting passport:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
});
