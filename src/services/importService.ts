import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import stagingData from '../data/staging_data.json';

export const importMasterData = async () => {
  const client = generateClient<Schema>();
  
  console.log('🚀 [DEBUG] Iniciando importación maestra...');
  console.log(`📊 [DEBUG] Total a procesar: ${stagingData.hotels.length} hoteles y ${stagingData.employees.length} empleados.`);

  const results = {
    hotelsCreated: 0,
    employeesCreated: 0,
    errors: [] as string[]
  };

  try {
    const hotelIdMap: Record<string, string> = {};
    
    // 1. Procesar Hoteles
    for (const hotel of stagingData.hotels) {
      try {
        console.log(`🔍 [DEBUG] Buscando hotel: ${hotel.name}...`);
        
        // Usamos una consulta simple para verificar existencia
        const { data: existingHotels, errors: listErrors } = await client.models.Hotel.list({
          filter: { name: { eq: hotel.name } }
        });

        if (listErrors) {
          console.error(`❌ [DEBUG] Error de AWS al listar hoteles:`, listErrors);
          throw new Error(listErrors[0].message);
        }

        if (existingHotels.length > 0) {
          hotelIdMap[hotel.name] = existingHotels[0].id;
          console.log(`⏩ [DEBUG] Hotel ya existe en la nube: ${hotel.name}`);
        } else {
          console.log(`🆕 [DEBUG] Creando nuevo hotel: ${hotel.name}...`);
          const { data: newHotel, errors: createErrors } = await client.models.Hotel.create({
            name: hotel.name,
            city: hotel.city,
            address: hotel.address,
            zone: hotel.zone as any,
          });

          if (createErrors) {
            console.error(`❌ [DEBUG] Error de AWS al crear hotel:`, createErrors);
            throw new Error(createErrors[0].message);
          }

          if (newHotel) {
            hotelIdMap[hotel.name] = newHotel.id;
            results.hotelsCreated++;
            console.log(`✅ [DEBUG] Hotel creado con éxito: ${hotel.name}`);
          }
        }
      } catch (err: any) {
        console.error(`💥 [DEBUG] Excepción en hotel ${hotel.name}:`, err);
        results.errors.push(`Hotel ${hotel.name}: ${err.message}`);
      }
    }

    // 2. Procesar Empleados
    console.log('👥 [DEBUG] Iniciando fase de empleados...');
    for (const emp of stagingData.employees) {
      try {
        const hotelId = hotelIdMap[emp.hotel_name];
        if (!hotelId) {
          console.warn(`⚠️ [DEBUG] Saltando empleado ${emp.name} porque su hotel no se encontró.`);
          continue;
        }

        console.log(`🔍 [DEBUG] Verificando empleado: ${emp.name} (#${emp.employee_number})...`);
        const { data: existingEmps } = await client.models.Employee.list({
          filter: { employee_number: { eq: emp.employee_number } }
        });

        if (existingEmps.length === 0) {
          console.log(`🆕 [DEBUG] Insertando empleado: ${emp.name}...`);
          const { errors: empErrors } = await client.models.Employee.create({
            employee_number: emp.employee_number,
            name: emp.name,
            role: 'Housekeeper',
            employee_type: 'permanente',
            payroll_type: 'timesheet',
            current_hotel_id: hotelId,
            is_active: true
          });

          if (empErrors) {
            console.error(`❌ [DEBUG] Error de AWS al crear empleado:`, empErrors);
            throw new Error(empErrors[0].message);
          }

          results.employeesCreated++;
          console.log(`✅ [DEBUG] Empleado creado: ${emp.name}`);
        } else {
          console.log(`⏩ [DEBUG] Empleado ya existe: ${emp.name}`);
        }
      } catch (err: any) {
        console.error(`💥 [DEBUG] Excepción en empleado ${emp.name}:`, err);
        results.errors.push(`Empleado ${emp.name}: ${err.message}`);
      }
    }

    console.log('🏁 [DEBUG] Importación finalizada.');
    return results;
  } catch (globalErr: any) {
    console.error('🚨 [DEBUG] ERROR GLOBAL CRÍTICO:', globalErr);
    throw globalErr;
  }
};
