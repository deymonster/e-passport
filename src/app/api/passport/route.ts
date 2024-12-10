import { NextResponse, NextRequest } from 'next/server';
import { repositories } from '@/lib/repositories';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;
    const orderNumber = searchParams.get('orderNumber') || undefined;

    // If dateTo is provided, set it to the end of the day
    if (dateTo) {
      dateTo.setHours(23, 59, 59, 999);
    }

    const { passports, totalCount } = await repositories.passport.getAllwithOptions({
      offset,
      limit,
      search,
      dateFrom,
      dateTo,
      orderNumber,
    });

    return NextResponse.json({ passports, totalCount }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error fetching passports');
    }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      sn,
      orderNumber,
      name,
      registryRecordId,
      type,
      productionDate,
      warrantyPeriod,
      batchId,
      documentIds,
    } = body;

    if (!sn || !orderNumber || !type || !productionDate || !warrantyPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: sn, orderNumber, type, productionDate, warrantyPeriod' },
        { status: 400 }
      );
    }

    const passport = await repositories.passport.createPassport({
      sn,
      orderNumber,
      name: name || null,
      registryRecordId: registryRecordId || null,
      type,
      productionDate: new Date(productionDate),
      warrantyPeriod,
      batchId: batchId || null,
      documentIds: documentIds || [],
    });

    return NextResponse.json(passport, { status: 201 });
  } catch (error) {

    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error creating passport');
    }
});
