async function testReconfirmation() {
    try {
        // 1. Login como admin
        console.log('🔐 Obteniendo token de admin...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@mgap.gub.uy',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        const adminToken = loginData.token;
        console.log('✅ Token obtenido exitosamente');
        
        // 2. Obtener lista de viajes
        console.log('\n📋 Obteniendo lista de viajes...');
        const tripsResponse = await fetch('http://localhost:5000/api/trips', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const trips = await tripsResponse.json();
        console.log(`📊 ${trips.length} viajes encontrados`);
        
        // Buscar un viaje confirmado por el chofer
        const confirmedTrip = trips.find(trip => 
            trip.driverConfirmation && 
            trip.driverConfirmation.confirmed === true &&
            trip.status === 'programado'
        );
        
        if (!confirmedTrip) {
            console.log('❌ No se encontró un viaje confirmado para probar');
            return;
        }
        
        console.log(`\n🎯 Viaje seleccionado: ${confirmedTrip._id}`);
        console.log(`📍 Destino actual: ${confirmedTrip.destination}`);
        console.log(`✅ Confirmado: ${confirmedTrip.driverConfirmation.confirmed}`);
        
        // 3. Editar el viaje con un cambio importante (destino)
        const newDestination = confirmedTrip.destination + ' (MODIFICADO)';
        console.log(`\n🔧 Modificando destino a: ${newDestination}`);
        
        const updateResponse = await fetch(`http://localhost:5000/api/trips/${confirmedTrip._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                destination: newDestination
            })
        });
        
        const updatedTrip = await updateResponse.json();
        console.log('\n🎉 Viaje actualizado exitosamente!');
        console.log(`📍 Nuevo destino: ${updatedTrip.destination}`);
        console.log(`✅ Estado de confirmación: ${updatedTrip.driverConfirmation.confirmed}`);
        console.log(`📅 Confirmación reseteada: ${updatedTrip.driverConfirmation.confirmed === false ? 'SÍ' : 'NO'}`);
        
        if (updatedTrip.driverConfirmation.confirmed === false) {
            console.log('\n🎊 ¡ÉXITO! La re-confirmación funciona correctamente');
            console.log('📱 Se debe haber enviado notificación al chofer');
        } else {
            console.log('\n❌ Error: La confirmación no fue reseteada');
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testReconfirmation();