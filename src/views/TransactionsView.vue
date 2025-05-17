<template>
  <div class="p-4">
    <div class="flex items-center space-x-4 mb-4">
      <input v-model="searchCarId" type="text" placeholder="Search by Car ID" class="border p-2 rounded w-full" />
      <button @click="openScanner" class="bg-blue-500 text-white px-4 py-2 rounded">Scan QR</button>
    </div>

    <div v-if="carDetails" class="border p-4 rounded mb-4 bg-white shadow">
      <h2 class="text-xl font-bold mb-2 text-gray-800">Car Details</h2>
      <p><strong>Plate Number:</strong> {{ carDetails.plateNumber }}</p>
      <p><strong>Vehicle ID:</strong> {{ carDetails.id }}</p>

      <div class="mt-4 space-x-4">
        <button @click="timeIn" class="bg-green-500 text-white px-4 py-2 rounded">Time IN</button>
        <button @click="timeOut" class="bg-red-500 text-white px-4 py-2 rounded">Time OUT</button>
      </div>
    </div>

    <div class="border p-4 rounded bg-white shadow">
      <h2 class="text-xl font-bold mb-2 text-gray-800">Available Parking Slots</h2>
      <ul>
        <li v-for="slot in availableSlots" :key="slot.slot_id">
          {{ slot.slot_label }} (Status: {{ slot.status }})
        </li>
      </ul>
    </div>

    <qrcode-stream @decode="onDecode" @init="onInit" v-if="scannerVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import { supabase } from '@/lib/supabase'

const searchCarId = ref('')
const carDetails = ref(null)
const availableSlots = ref([])
const scannerVisible = ref(false)

// Fetch all available slots
const fetchAvailableSlots = async () => {
  const { data, error } = await supabase
    .from('parking_slots')
    .select('*')
    .eq('status', 'available')

  if (error) {
    console.error('Error fetching slots:', error.message)
    return
  }

  availableSlots.value = data
}

// Fetch vehicle details using car ID
const fetchCarDetails = async (carId) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', carId)
    .single()

  if (error) {
    console.error('Vehicle not found:', error.message)
    carDetails.value = null
    return
  }

  carDetails.value = data
}

// QR scanner handlers
const openScanner = () => {
  scannerVisible.value = true
}

const onDecode = (result) => {
  scannerVisible.value = false
  fetchCarDetails(result)
}

const onInit = (promise) => {
  promise.catch(console.error)
}

// Insert time-in record
const timeIn = async () => {
  if (!carDetails.value || availableSlots.value.length === 0) return

  const { error } = await supabase
    .from('parking_records')
    .insert({
      plateNumber: carDetails.value.plateNumber,
      vehicle_id: carDetails.value.id,
      slot_id: availableSlots.value[0].slot_id,
      time_in: new Date().toISOString(),
      status: 'active'
    })

  if (error) {
    console.error('Time-in error:', error.message)
  } else {
    await fetchAvailableSlots()
  }
}

// Update record with time-out
const timeOut = async () => {
  if (!carDetails.value) return

  const { data, error } = await supabase
    .from('parking_records')
    .select('*')
    .eq('vehicle_id', carDetails.value.id)
    .eq('status', 'active')
    .order('time_in', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('No active record found:', error?.message)
    return
  }

  const timeIn = new Date(data.time_in)
  const now = new Date()
  const duration = Math.ceil((now - timeIn) / 60000)
  const totalFee = duration * 2

  const { error: updateError } = await supabase
    .from('parking_records')
    .update({
      time_out: now.toISOString(),
      duration_minutes: duration,
      total_fee: totalFee,
      status: 'completed'
    })
    .eq('record_id', data.record_id)

  if (updateError) {
    console.error('Time-out update failed:', updateError.message)
  } else {
    await fetchAvailableSlots()
  }
}

onMounted(() => {
  fetchAvailableSlots()
})
</script>

<style scoped>
</style>
