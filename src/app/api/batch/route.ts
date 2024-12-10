import { NextResponse, NextRequest } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth (async (req: NextRequest) => {
  try {

    const batches = await repositories.batch.getAll();

    const enrichedBatches = batches.map((batch) => ({
      ...batch,
      passportsCount: batch.passports?.length || 0,
    }));
    return NextResponse.json(enrichedBatches, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        throw new Error('Error getting batches');
    }
});

export const POST = withAdminAuth (async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      orderNumber, 
      registryRecordId, 
      warrantyPeriod, 
      type, 
      productionDate, 
      documents, 
      computerCount, 
      name 
    } = body;

    const warrantyPeriodEnum =
      warrantyPeriod === 12
        ? 'MONTHS_12'
        : warrantyPeriod === 24
        ? 'MONTHS_24'
        : warrantyPeriod === 36
        ? 'MONTHS_36'
        : null;

    const deviceTypeEnum = type === '1' ? 'ARM' : type === '2' ? 'PC' : null;

    if (!orderNumber || !warrantyPeriodEnum || !deviceTypeEnum || !productionDate || !computerCount || !name)  {
      return NextResponse.json(
        { error: 'Missing required fields: orderNumber, warrantyPeriod, type, productionDate' },
        { status: 400 }
      );
    }

    const batch = await repositories.batch.createBatch({
      orderNumber,
      registryRecordId: registryRecordId || null,
      warrantyPeriod: warrantyPeriodEnum,
      type: deviceTypeEnum,
      productionDate: new Date(productionDate),
      documentIds: documents,
      numberOfPassports: computerCount,
      passportName: name
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        throw new Error('Error creating batch');
  }
})
