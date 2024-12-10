import { NextRequest, NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';

const passportRepository = repositories.passport;

// Получение паспорта по серийному номеру и номеру заказа для пользователя
export async function POST(request: NextRequest) {
  try {
    const { sn, orderNumber } = await request.json();

    // Проверка наличия необходимых данных
    if (!sn || !orderNumber) {
      return NextResponse.json(
        { error: 'Serial number and order number are required' },
        { status: 400 }
      );
    }

    // Получаем паспорт по серийному номеру и номеру заказа
    const passport = await passportRepository.getBySerialAndOrder(sn, orderNumber);
    
    if (!passport) {
      return NextResponse.json(
        { error: 'Passport not found' },
        { status: 404 }
      );
    }

    // Получаем связанные данные
    const passportWithRelations = await passportRepository.getPassportWithRelations(passport.id);

    return NextResponse.json(passportWithRelations, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw new Error('Error validating passport');
  }
}
